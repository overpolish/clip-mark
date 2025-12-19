use chrono::{DateTime, Utc};
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

         // Convert to human-readable format (HH:MM:SS.mmm)
         let total_seconds = actual_timecode_ms / 1000;
         let milliseconds = actual_timecode_ms % 1000;
         let hours = total_seconds / 3600;
         let minutes = (total_seconds % 3600) / 60;
         let seconds = total_seconds % 60;

         let timecode = format!(
            "{:02}:{:02}:{:02}.{:03}",
            hours, minutes, seconds, milliseconds
         );

         println!(
    "Captured note: {} | Timecode: {} | Raw ms: {} | recording_start: {:?} | accumulated: {} | note_time: {} | path: {:?}",
    note, timecode, actual_timecode_ms, state.recording_start, state.accumulated_pause_duration, note_timestamp, state.note_file_path
);
      } else {
         return Err("Recording start time is not set".to_string());
      }
   } else {
      return Err("Failed to lock recording state".to_string());
   }

   Ok(())
}
