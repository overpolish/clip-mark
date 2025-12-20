use chrono::{DateTime, Duration, TimeDelta, Utc};
use tauri::Manager;

use crate::state::RecordingStateMutex;

#[tauri::command]
pub async fn capture_note(
   app_handle: tauri::AppHandle,
   note: String,
   date: DateTime<Utc>,
) -> Result<(), String> {
   let recording_state = app_handle.state::<RecordingStateMutex>();
   let note_timestamp = date.timestamp_millis();

   if let Ok(state) = recording_state.lock() {
      if !state.recording_status.active {
         return Err("Recording is not active".to_string());
      }

      if let Some(recording_start) = state.recording_start {
         let actual_timecode_ms = if state.recording_status.paused {
            // If paused, use the pause time as the note timecode
            if let Some(pause_start) = state.pause_start {
               (pause_start - recording_start)
                  - state.accumulated_pause_duration
            } else {
               return Err("Paused but pause time not set".to_string());
            }
         } else {
            // If recording, calculate based on current time
            let total_elapsed = note_timestamp - recording_start;
            total_elapsed - state.accumulated_pause_duration
         };

         let timecode = Duration::milliseconds(actual_timecode_ms);
         if let Some(note_file_path) = &state.note_file_path {
            write_note_to_file(
               std::path::Path::new(note_file_path),
               timecode,
               &note,
            )?;
         }
      } else {
         return Err("Recording start time is not set".to_string());
      }
   } else {
      return Err("Failed to lock recording state".to_string());
   }

   Ok(())
}

fn write_note_to_file(
   file_path: &std::path::Path,
   timecode: TimeDelta,
   note: &str,
) -> Result<(), String> {
   use std::fs::OpenOptions;
   use std::io::Write;

   let mut file = OpenOptions::new()
      .create(true)
      .append(true)
      .open(file_path)
      .map_err(|e| format!("Failed to open note file: {}", e))?;

   let hours = timecode.num_hours();
   let minutes = timecode.num_minutes() % 60;
   let seconds = timecode.num_seconds() % 60;
   let milliseconds = timecode.num_milliseconds() % 1000;
   let formatted_timecode = format!(
      "{:02}:{:02}:{:02}.{:03}",
      hours, minutes, seconds, milliseconds
   );

   writeln!(file, "[{}] {}", formatted_timecode, note)
      .map_err(|e| format!("Failed to write note to file: {}", e))?;

   Ok(())
}
