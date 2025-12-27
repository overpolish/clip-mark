use tauri::{
   Manager, PhysicalPosition, PhysicalSize, Rect, Runtime, WebviewWindow,
   Window,
};
pub use tauri_plugin_positioner::Position;

#[derive(Debug, thiserror::Error)]
pub enum TrayError {
   #[error("Tray icon with id '{0}' not found")]
   TrayNotFound(String),

   #[error("Tray rect is missing")]
   TrayRectNone,

   #[error(transparent)]
   Tauri(#[from] tauri::Error),
}

type MoveWindowToTrayResult<T> = std::result::Result<T, TrayError>;

pub trait WindowTrayExt {
   fn move_window_to_tray(
      &self,
      tray_rect: Rect,
      position: Position,
   ) -> MoveWindowToTrayResult<()>;
   fn move_window_to_tray_constrained(
      &self,
      tray_rect: Rect,
      position: Position,
   ) -> MoveWindowToTrayResult<()>;
   fn move_window_to_tray_id(
      &self,
      tray_id: &str,
      position: Position,
   ) -> MoveWindowToTrayResult<()>;
}

impl<R: Runtime> WindowTrayExt for WebviewWindow<R> {
   fn move_window_to_tray(
      &self,
      tray_rect: Rect,
      position: Position,
   ) -> MoveWindowToTrayResult<()> {
      self
         .as_ref()
         .window()
         .move_window_to_tray(tray_rect, position)
   }

   fn move_window_to_tray_constrained(
      &self,
      tray_rect: Rect,
      position: Position,
   ) -> MoveWindowToTrayResult<()> {
      self
         .as_ref()
         .window()
         .move_window_to_tray_constrained(tray_rect, position)
   }

   fn move_window_to_tray_id(
      &self,
      tray_id: &str,
      position: Position,
   ) -> MoveWindowToTrayResult<()> {
      self
         .as_ref()
         .window()
         .move_window_to_tray_id(tray_id, position)
   }
}

impl<R: Runtime> WindowTrayExt for Window<R> {
   fn move_window_to_tray(
      &self,
      tray_rect: Rect,
      position: Position,
   ) -> MoveWindowToTrayResult<()> {
      let temp_physical = tray_rect.position.to_physical(1.0);
      let scale_factor = self
         .monitor_from_point(temp_physical.x, temp_physical.y)?
         .map(|m| m.scale_factor())
         .unwrap_or(self.scale_factor()?);

      let tray_pos_phys = tray_rect.position.to_physical(scale_factor);
      let tray_size_phys: PhysicalSize<i32> =
         tray_rect.size.to_physical(scale_factor);
      let window_size = self.outer_size()?;

      let window_size_phys = PhysicalSize {
         width: window_size.width as i32,
         height: window_size.height as i32,
      };

      let pos = calculate_tray_position(
         tray_pos_phys.x,
         tray_pos_phys.y,
         tray_size_phys.width,
         tray_size_phys.height,
         window_size_phys,
         position,
      );

      self.set_position(pos).map_err(TrayError::Tauri)
   }

   fn move_window_to_tray_constrained(
      &self,
      tray_rect: Rect,
      position: Position,
   ) -> MoveWindowToTrayResult<()> {
      self.move_window_to_tray(tray_rect, position)?;

      let mut pos = self.outer_position()?;
      let size = self.outer_size()?;

      if let Some(monitor) =
         self.monitor_from_point(pos.x as f64, pos.y as f64)?
      {
         let m_pos = monitor.position();
         let m_size = monitor.size();

         pos.x = pos
            .x
            .clamp(m_pos.x, m_pos.x + m_size.width as i32 - size.width as i32);
         pos.y = pos.y.clamp(
            m_pos.y,
            m_pos.y + m_size.height as i32 - size.height as i32,
         );

         self.set_position(pos)?;
      }

      Ok(())
   }

   fn move_window_to_tray_id(
      &self,
      tray_id: &str,
      position: Position,
   ) -> MoveWindowToTrayResult<()> {
      // Wrap the string in the Tray variant
      let tray = self
         .app_handle()
         .tray_by_id(tray_id)
         .ok_or_else(|| TrayError::TrayNotFound(tray_id.to_string()))?;

      let tray_rect = tray
         .rect()
         .map_err(|_| TrayError::TrayRectNone)?
         .ok_or(TrayError::TrayRectNone)?;

      self
         .move_window_to_tray_constrained(tray_rect, position)
         .map_err(|_| TrayError::TrayRectNone)
   }
}

// Keep this internal/private to the module
fn calculate_tray_position(
   tray_x: i32,
   tray_y: i32,
   tray_width: i32,
   tray_height: i32,
   window_size: PhysicalSize<i32>,
   position: Position,
) -> PhysicalPosition<i32> {
   use Position::*;

   let (x, y_base) = match position {
      TrayLeft => (tray_x, tray_y - window_size.height),
      TrayBottomLeft => (tray_x, tray_y),
      TrayRight => (
         tray_x + tray_width - window_size.width,
         tray_y - window_size.height,
      ),
      TrayBottomRight => (tray_x + tray_width - window_size.width, tray_y),
      TrayCenter => (
         tray_x + (tray_width / 2) - (window_size.width / 2),
         tray_y - window_size.height,
      ),
      TrayBottomCenter => {
         (tray_x + (tray_width / 2) - (window_size.width / 2), tray_y)
      }
      _ => panic!("Unsupported position"),
   };

   let is_bottom = matches!(
      position,
      TrayBottomLeft | TrayBottomRight | TrayBottomCenter
   );

   let y = if !is_bottom && y_base < 0 {
      #[cfg(target_os = "macos")]
      {
         tray_y
      }
      #[cfg(not(target_os = "macos"))]
      {
         tray_y + tray_height
      }
   } else {
      y_base
   };

   PhysicalPosition { x, y }
}
