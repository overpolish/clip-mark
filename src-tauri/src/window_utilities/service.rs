use std::{
   collections::HashMap,
   path::{Path, PathBuf},
   time::Duration,
};

use ::windows::Win32::{
   Foundation::{CloseHandle, HINSTANCE, HWND, LPARAM},
   Graphics::{
      Dwm::{DwmGetWindowAttribute, DWMWA_CLOAKED},
      Gdi::{
         CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, GetDC,
         GetMonitorInfoW, GetObjectW, MonitorFromWindow, ReleaseDC,
         SelectObject, BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
         DIB_RGB_COLORS, HDC, HGDIOBJ, MONITORINFO, MONITOR_DEFAULTTONEAREST,
      },
   },
   System::Threading::{
      OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
      PROCESS_QUERY_LIMITED_INFORMATION,
   },
   UI::{
      Shell::ExtractIconW,
      WindowsAndMessaging::{
         DestroyIcon, DrawIconEx, EnumWindows, GetIconInfo, GetSystemMetrics,
         GetWindowLongPtrW, GetWindowLongW, GetWindowRect, GetWindowTextW,
         GetWindowThreadProcessId, IsWindowVisible, SetWindowPos, DI_NORMAL,
         GWL_EXSTYLE, GWL_STYLE, HICON, ICONINFO, SM_CXSCREEN, SM_CYSCREEN,
         SWP_NOSIZE, SWP_NOZORDER, WS_EX_TOOLWINDOW,
      },
   },
};
use image::{ImageBuffer, Rgba};
use log::{info, warn};
use tauri::PhysicalPosition;
use windows::Win32::{
   Graphics::Gdi::GetDIBits,
   UI::WindowsAndMessaging::{
      SetWindowLongPtrW, ShowWindow, SWP_FRAMECHANGED, SWP_NOACTIVATE,
      SWP_NOMOVE, SW_RESTORE, SW_SHOWNA, WS_BORDER, WS_CAPTION, WS_DLGFRAME,
      WS_EX_CLIENTEDGE, WS_EX_DLGMODALFRAME, WS_EX_STATICEDGE,
      WS_EX_WINDOWEDGE, WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU,
      WS_THICKFRAME, WS_VISIBLE,
   },
};

use crate::window_utilities::commands::WindowInfo;

const MAX_WINDOW_TITLE_LEN: usize = 512;
const MAX_PATH_LEN: usize = 512;
const ICON_CACHE_DURATION: Duration = Duration::from_secs(60 * 60 * 24); // 24 hours

// #region: Windows Enumeration and Icon Extraction

pub fn get_visible_windows(icons_dir: PathBuf) -> Vec<WindowInfo> {
   unsafe {
      let mut windows: Vec<WindowInfo> = Vec::new();
      let mut exe_paths = HashMap::<String, String>::new();
      let mut app_icons: HashMap<String, String> = HashMap::new();

      let _ = EnumWindows(
         Some(enum_windows_callback),
         LPARAM(&mut windows as *mut _ as isize),
      );

      for window in windows.iter_mut() {
         if window.app_name == "Unknown" {
            continue;
         }

         exe_paths.entry(window.app_name.clone()).or_insert_with(|| {
            get_exe_path_from_hwnd(HWND(window.hwnd as _))
               .ok()
               .unwrap_or_default()
         });

         if !app_icons.contains_key(&window.app_name) {
            if let Some(exe_path) = exe_paths.get(&window.app_name) {
               if let Ok(icon_path) = extract_exe_icon_to_png(
                  exe_path,
                  &window.app_name,
                  &icons_dir,
               ) {
                  app_icons.insert(
                     window.app_name.clone(),
                     icon_path.to_str().unwrap_or_default().to_string(),
                  );
               };
            }
         }
      }

      for window in windows.iter_mut() {
         if let Some(icon_url) = app_icons.get(&window.app_name) {
            window.icon_path = Some(icon_url.clone());
         }
      }

      windows
   }
}

unsafe extern "system" fn enum_windows_callback(
   hwnd: HWND,
   lparam: LPARAM,
) -> ::windows::core::BOOL {
   let windows = &mut *(lparam.0 as *mut Vec<WindowInfo>);

   if !IsWindowVisible(hwnd).as_bool() {
      return true.into();
   }

   // Check if the window is cloaked (hidden by the Windows)
   let mut cloaked: u32 = 0;
   if DwmGetWindowAttribute(
      hwnd,
      DWMWA_CLOAKED,
      &mut cloaked as *mut _ as *mut _,
      std::mem::size_of::<u32>() as u32,
   )
   .is_ok()
      && cloaked != 0
   {
      return true.into();
   }

   let mut title: [u16; MAX_WINDOW_TITLE_LEN] = [0; MAX_WINDOW_TITLE_LEN];
   let len = GetWindowTextW(hwnd, &mut title);
   let title = String::from_utf16_lossy(&title[..len as usize]);

   if title.is_empty() {
      return true.into();
   }

   // Filter out tool windows and other non-app windows
   let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
   if (ex_style & WS_EX_TOOLWINDOW.0 as i32) != 0 {
      return true.into();
   }

   // PID to fetch executable name
   let mut pid: u32 = 0;
   GetWindowThreadProcessId(hwnd, Some(&mut pid));

   let process_handle =
      OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
   let mut app_name = String::from("Unknown");

   if let Ok(handle) = process_handle {
      let mut exe_path: [u16; 512] = [0; 512];
      let mut size = exe_path.len() as u32;

      if QueryFullProcessImageNameW(
         handle,
         PROCESS_NAME_WIN32,
         ::windows::core::PWSTR(exe_path.as_mut_ptr()),
         &mut size,
      )
      .is_ok()
      {
         let full_path = String::from_utf16_lossy(&exe_path[..size as usize]);
         if let Some(name) = full_path.rsplit('\\').next() {
            app_name = name.to_string();
         }
      }

      let _ = CloseHandle(handle);
   }

   // Exclude this application
   if app_name == "clip-mark.exe" {
      return true.into();
   }

   windows.push(WindowInfo {
      title,
      app_name,
      hwnd: hwnd.0 as isize,
      icon_path: None,
   });
   true.into()
}

fn extract_exe_icon_to_png(
   exe_path: &str,
   app_name: &str,
   icons_dir: &Path,
) -> ::windows::core::Result<PathBuf> {
   unsafe {
      let safe_name = app_name
         .replace(".exe", "")
         .replace(|c: char| !c.is_alphabetic() && c != '-' && c != '_', "_");
      let output_path = icons_dir.join(format!("{}.png", safe_name));

      if should_use_cached_icon(&output_path, exe_path) {
         return Ok(output_path);
      }

      let hicon = extract_icon_from_exe(exe_path)?;

      let result = (|| -> ::windows::core::Result<PathBuf> {
         icon_to_png(hicon, &output_path)?;
         Ok(output_path)
      })();

      let _ = DestroyIcon(hicon);
      result
   }
}

fn should_use_cached_icon(icon_path: &Path, exe_path: &str) -> bool {
   let icon_metadata = match std::fs::metadata(icon_path) {
      Ok(meta) => meta,
      Err(_) => return false,
   };

   let icon_modified = match icon_metadata.modified() {
      Ok(time) => time,
      Err(_) => return false,
   };

   let now = std::time::SystemTime::now();
   let icon_age = match now.duration_since(icon_modified) {
      Ok(duration) => duration,
      Err(_) => return false,
   };

   if icon_age > ICON_CACHE_DURATION {
      return false;
   }

   if let Ok(exe_metadata) = std::fs::metadata(exe_path) {
      if let Ok(exe_modified) = exe_metadata.modified() {
         if exe_modified > icon_modified {
            return false;
         }
      }
   }

   true
}

unsafe fn extract_icon_from_exe(
   exe_path: &str,
) -> ::windows::core::Result<HICON> {
   let path_wide: Vec<u16> =
      exe_path.encode_utf16().chain(std::iter::once(0)).collect();
   let hicon = ExtractIconW(
      Some(HINSTANCE::default()),
      ::windows::core::PWSTR::from_raw(path_wide.as_ptr() as *mut _),
      0,
   );

   if hicon.0 as usize <= 1 {
      return Err(::windows::core::Error::from(
         ::windows::Win32::Foundation::E_FAIL,
      ));
   }

   Ok(hicon)
}

unsafe fn icon_to_png(
   hicon: HICON,
   output_path: &Path,
) -> ::windows::core::Result<()> {
   // Get icon info - bitmaps for color and mask
   let mut icon_info = ICONINFO::default();
   GetIconInfo(hicon, &mut icon_info)?;

   let hbm_color = icon_info.hbmColor;

   // Get bitmap details
   let mut bm = BITMAP::default();
   GetObjectW(
      HGDIOBJ(hbm_color.0),
      std::mem::size_of::<BITMAP>() as i32,
      Some(&mut bm as *mut _ as *mut _),
   );

   let width = bm.bmWidth as u32;
   let height = bm.bmHeight as u32;

   // Create device contexts (DCs) - screen and memory
   let hdc = GetDC(Some(HWND::default()));
   let hdc_mem = CreateCompatibleDC(Some(hdc));

   // Bitmap for 32-bit RGBA DIB section
   let bmi = BITMAPINFO {
      bmiHeader: BITMAPINFOHEADER {
         biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
         biWidth: width as i32,
         biHeight: -(height as i32),
         biPlanes: 1,
         biBitCount: 32,
         biCompression: BI_RGB.0,
         ..Default::default()
      },
      ..Default::default()
   };

   // Create DIB section for pixels
   let mut bits: *mut std::ffi::c_void = std::ptr::null_mut();
   let hbm_dib = CreateDIBSection(
      Some(hdc_mem),
      &bmi,
      DIB_RGB_COLORS,
      &mut bits,
      None,
      0,
   )?;

   let old_bm = SelectObject(hdc_mem, hbm_dib.into());

   // Render icon into memory DC
   let draw_result = DrawIconEx(
      hdc_mem,
      0,
      0,
      hicon,
      width as i32,
      height as i32,
      0,
      None,
      DI_NORMAL,
   );

   if draw_result.is_err() {
      cleanup_gdi_objects(hdc, hdc_mem, old_bm, hbm_dib.into(), icon_info);
      return draw_result;
   }

   // Copy pixel data from DIB into image buffer
   let pixel_count = (width * height) as usize;
   let pixel_data =
      std::slice::from_raw_parts(bits as *const u8, pixel_count * 4);

   let mut img_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(width, height);

   let alpha_all_zero = pixel_data.chunks_exact(4).all(|px| px[3] == 0);
   if alpha_all_zero && !icon_info.hbmMask.is_invalid() {
      let mut bmp_mask = BITMAP::default();
      let size = std::mem::size_of::<BITMAP>() as i32;

      if GetObjectW(
         HGDIOBJ(icon_info.hbmMask.0),
         size,
         Some(&mut bmp_mask as *mut _ as *mut _),
      ) != 0
      {
         let bmi_mask = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
               biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
               biWidth: bmp_mask.bmWidth,
               biHeight: -bmp_mask.bmHeight, // Top-down
               biPlanes: 1,
               biBitCount: 1,
               biCompression: BI_RGB.0,
               ..Default::default()
            },
            ..Default::default()
         };

         // Each scanline is aligned to 32 bits (4 bytes)
         let stride = (width.div_ceil(32) * 4) as usize;
         let mut mask_bits = vec![0u8; stride * height as usize];

         let mask_lines = GetDIBits(
            hdc,
            icon_info.hbmMask,
            0,
            height,
            Some(mask_bits.as_mut_ptr() as *mut _),
            &bmi_mask as *const _ as *mut _,
            DIB_RGB_COLORS,
         );

         if mask_lines != 0 {
            for y in 0..height as usize {
               for x in 0..width as usize {
                  let byte_index = y * stride + x / 8;
                  let bit_index = 7 - (x % 8);
                  let mask_bit = (mask_bits[byte_index] >> bit_index) & 1;

                  let pixel_index = y * width as usize + x;
                  let offset = pixel_index * 4;

                  let b = pixel_data[offset];
                  let g = pixel_data[offset + 1];
                  let r = pixel_data[offset + 2];

                  // Mask bit 1 means transparent
                  let alpha = if mask_bit == 1 { 0 } else { 255 };

                  img_buffer.get_pixel_mut(x as u32, y as u32).0 =
                     [r, g, b, alpha];
               }
            }
         }
      }
   } else {
      // Use existing alpha channel
      for (i, pixel) in img_buffer.pixels_mut().enumerate() {
         let offset = i * 4;
         let b = pixel_data[offset];
         let g = pixel_data[offset + 1];
         let r = pixel_data[offset + 2];
         let a = pixel_data[offset + 3];

         if a == 0 {
            pixel.0 = [0, 0, 0, 0];
         } else if a == 255 {
            pixel.0 = [r, g, b, 255];
         } else {
            // Un-premultiply alpha
            pixel.0 = [
               ((r as u16 * 255) / (a as u16)) as u8,
               ((g as u16 * 255) / (a as u16)) as u8,
               ((b as u16 * 255) / (a as u16)) as u8,
               a,
            ];
         }
      }
   }

   // Save image as a PNG
   let save_result = img_buffer.save(output_path).map_err(|_| {
      ::windows::core::Error::from(::windows::Win32::Foundation::E_FAIL)
   });

   cleanup_gdi_objects(hdc, hdc_mem, old_bm, hbm_dib.into(), icon_info);

   save_result
}

unsafe fn cleanup_gdi_objects(
   hdc: HDC,
   hdc_mem: HDC,
   old_bm: HGDIOBJ,
   hbm_dib: HGDIOBJ,
   icon_info: ICONINFO,
) {
   SelectObject(hdc_mem, old_bm);
   let _ = DeleteObject(hbm_dib);
   let _ = DeleteObject(icon_info.hbmColor.into());
   let _ = DeleteObject(icon_info.hbmMask.into());
   let _ = DeleteDC(hdc_mem);
   ReleaseDC(Some(HWND::default()), hdc);
}

unsafe fn get_exe_path_from_hwnd(
   hwnd: HWND,
) -> ::windows::core::Result<String> {
   let mut pid: u32 = 0;
   GetWindowThreadProcessId(hwnd, Some(&mut pid));

   let process_handle =
      OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid)?;

   let result = (|| -> ::windows::core::Result<String> {
      let mut exe_path: [u16; MAX_PATH_LEN] = [0; MAX_PATH_LEN];
      let mut size = exe_path.len() as u32;

      QueryFullProcessImageNameW(
         process_handle,
         PROCESS_NAME_WIN32,
         ::windows::core::PWSTR(exe_path.as_mut_ptr()),
         &mut size,
      )?;

      Ok(String::from_utf16_lossy(&exe_path[..size as usize]))
   })();

   let _ = CloseHandle(process_handle);
   result
}

// #endregion

// #region Center, Borderless, Fullscreen Window Functions

pub fn center_window(hwnd: isize) -> ::windows::core::Result<()> {
   unsafe {
      info!("Centering window: {}", hwnd);
      let hwnd = HWND(hwnd as _);

      // Window rect
      let mut window_rect = ::windows::Win32::Foundation::RECT::default();
      GetWindowRect(hwnd, &mut window_rect)?;

      let window_width = window_rect.right - window_rect.left;
      let window_height = window_rect.bottom - window_rect.top;

      // Monitor info
      let monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
      let mut monitor_info = MONITORINFO {
         cbSize: std::mem::size_of::<MONITORINFO>() as u32,
         ..Default::default()
      };

      let (center_x, center_y) =
         if GetMonitorInfoW(monitor, &mut monitor_info as *mut _ as *mut _)
            .as_bool()
         {
            // Calculate centered position
            let monitor_rect = monitor_info.rcWork;
            let monitor_width = monitor_rect.right - monitor_rect.left;
            let monitor_height = monitor_rect.bottom - monitor_rect.top;

            (
               monitor_rect.left + (monitor_width - window_width) / 2,
               monitor_rect.top + (monitor_height - window_height) / 2,
            )
         } else {
            warn!("Failed to get monitor info, using primary monitor");
            let screen_width = GetSystemMetrics(SM_CXSCREEN);
            let screen_height = GetSystemMetrics(SM_CYSCREEN);

            (
               (screen_width - window_width) / 2,
               (screen_height - window_height) / 2,
            )
         };

      // Center window
      SetWindowPos(
         hwnd,
         Some(HWND::default()),
         center_x,
         center_y,
         0,
         0,
         SWP_NOSIZE | SWP_NOZORDER,
      )?;

      Ok(())
   }
}

pub fn make_borderless(hwnd: isize) -> ::windows::core::Result<()> {
   unsafe {
      info!("Making window borderless: {}", hwnd);
      let hwnd = HWND(hwnd as _);

      let style = GetWindowLongPtrW(hwnd, GWL_STYLE);
      let new_style = (style as u32)
         & !(WS_CAPTION.0
            | WS_THICKFRAME.0
            | WS_BORDER.0
            | WS_DLGFRAME.0
            | WS_SYSMENU.0)
         | WS_POPUP.0
         | WS_VISIBLE.0;
      SetWindowLongPtrW(hwnd, GWL_STYLE, new_style as isize);

      // Remove extended window styles
      let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
      let new_ex_style = (ex_style as u32)
         & !(WS_EX_DLGMODALFRAME.0
            | WS_EX_WINDOWEDGE.0
            | WS_EX_CLIENTEDGE.0
            | WS_EX_STATICEDGE.0);
      SetWindowLongPtrW(hwnd, GWL_EXSTYLE, new_ex_style as isize);

      // Resize to refresh window frame
      let mut rect = ::windows::Win32::Foundation::RECT::default();
      GetWindowRect(hwnd, &mut rect)?;

      let width = rect.right - rect.left;
      let height = rect.bottom - rect.top;

      // Refresh window to apply changes
      // NOTE: for some apps, just setting SWP_FRAMECHANGED doesn't fully remove the border
      SetWindowPos(
         hwnd,
         None,
         rect.left,
         rect.top,
         width - 1, // Removes stale window frame
         height,
         SWP_FRAMECHANGED | SWP_NOACTIVATE | SWP_NOMOVE,
      )?;

      // Restore original size
      SetWindowPos(
         hwnd,
         None,
         rect.left,
         rect.top,
         width,
         height,
         SWP_FRAMECHANGED | SWP_NOACTIVATE | SWP_NOMOVE,
      )?;

      Ok(())
   }
}

pub fn restore_border(hwnd: isize) -> ::windows::core::Result<()> {
   unsafe {
      info!("Restoring window border: {}", hwnd);
      let hwnd = HWND(hwnd as _);

      let style = GetWindowLongPtrW(hwnd, GWL_STYLE);
      let new_style = (style as u32) & !(WS_POPUP.0)
         | WS_CAPTION.0
         | WS_THICKFRAME.0
         | WS_SYSMENU.0
         | WS_MINIMIZEBOX.0
         | WS_MAXIMIZEBOX.0;
      SetWindowLongPtrW(hwnd, GWL_STYLE, new_style as isize);

      let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
      let new_ex_style =
         (ex_style as u32) | WS_EX_WINDOWEDGE.0 | WS_EX_CLIENTEDGE.0;
      SetWindowLongPtrW(hwnd, GWL_EXSTYLE, new_ex_style as isize);

      SetWindowPos(
         hwnd,
         None,
         0,
         0,
         0,
         0,
         SWP_FRAMECHANGED | SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOSIZE,
      )?;

      Ok(())
   }
}

pub fn fullscreen_window(hwnd: isize) -> ::windows::core::Result<()> {
   unsafe {
      info!("Fullscreen window: {}", hwnd);
      make_borderless(hwnd)?;

      let hwnd = HWND(hwnd as _);

      let _ = ShowWindow(hwnd, SW_RESTORE); // Ensure window is not maximized

      // Fullscreen without borders
      let monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
      let mut monitor_info = MONITORINFO {
         cbSize: std::mem::size_of::<MONITORINFO>() as u32,
         ..Default::default()
      };

      if GetMonitorInfoW(monitor, &mut monitor_info as *mut _ as *mut _)
         .as_bool()
      {
         let monitor_rect = monitor_info.rcMonitor;
         let width = monitor_rect.right - monitor_rect.left;
         let height = monitor_rect.bottom - monitor_rect.top;

         SetWindowPos(
            hwnd,
            None,
            monitor_rect.left,
            monitor_rect.top,
            width,
            height,
            SWP_NOZORDER | SWP_NOACTIVATE,
         )?;
      } else {
         warn!("Failed to get monitor info for fullscreen");
      }

      Ok(())
   }
}

// #endregion

// #region WebviewWindow Functions

pub trait WindowUtilitiesExt {
   /// Show a window without focusing it
   fn show_without_focus(&self);
   /// Adjusts the window position to be above the taskbar
   fn position_above_taskbar(&self);
}

impl WindowUtilitiesExt for tauri::WebviewWindow {
   fn show_without_focus(&self) {
      if let Ok(hwnd) = self.hwnd() {
         unsafe {
            let _ = ShowWindow(HWND(hwnd.0 as _), SW_SHOWNA);
         }
      }
   }

   fn position_above_taskbar(&self) {
      if let Ok(Some(monitor)) = self.current_monitor() {
         let taskbar_top = monitor.work_area().size.height;
         let window_size = self.outer_size().unwrap_or_default();

         // Window size excludes taskbar height, we treat bottom of work area as top of taskbar
         let y = taskbar_top.saturating_sub(window_size.height);

         let window_position = PhysicalPosition {
            x: self.outer_position().unwrap_or_default().x,
            y: y as i32,
         };

         let _ = self.as_ref().window().set_position(window_position);
      }
   }
}

// #endregion
