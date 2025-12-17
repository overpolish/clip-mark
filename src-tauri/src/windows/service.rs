use std::{
    collections::{HashMap, HashSet},
    path::{Path, PathBuf},
};

use image::{ImageBuffer, Rgba};
use windows::{
    core::{BOOL, PWSTR},
    Win32::{
        Foundation::{CloseHandle, HINSTANCE, HWND, LPARAM},
        Graphics::{
            Dwm::{DwmGetWindowAttribute, DWMWA_CLOAKED},
            Gdi::{
                CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, GetDC, GetObjectW,
                ReleaseDC, SelectObject, BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
                DIB_RGB_COLORS, HGDIOBJ,
            },
        },
        System::Threading::{
            OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
            PROCESS_QUERY_LIMITED_INFORMATION,
        },
        UI::{
            Shell::ExtractIconW,
            WindowsAndMessaging::{
                DestroyIcon, DrawIconEx, EnumWindows, GetIconInfo, GetWindowLongW, GetWindowTextW,
                GetWindowThreadProcessId, IsWindowVisible, DI_NORMAL, GWL_EXSTYLE, HICON, ICONINFO,
                WS_EX_TOOLWINDOW,
            },
        },
    },
};

use crate::windows::commands::WindowInfo;

pub fn get_visible_windows(icons_dir: PathBuf) -> Vec<WindowInfo> {
    unsafe {
        let mut windows: Vec<WindowInfo> = Vec::new();
        let mut exe_paths = HashMap::<String, String>::new();
        let mut processes_exes = HashSet::<String>::new();
        let mut app_icons: HashMap<String, String> = HashMap::new();

        let _ = EnumWindows(
            Some(enum_windows_callback),
            LPARAM(&mut windows as *mut _ as isize),
        );

        for window in windows.iter_mut() {
            if window.app_name == "Unknown" {
                continue;
            }

            if !exe_paths.contains_key(&window.app_name) {
                if let Some(path) = get_exe_path_from_hwnd(HWND(window.hwnd as _)) {
                    exe_paths.insert(window.app_name.clone(), path);
                }
            }

            if !processes_exes.contains(&window.app_name) {
                if let Some(exe_path) = exe_paths.get(&window.app_name) {
                    if let Some(icon_path) =
                        extract_exe_icon_to_png(exe_path, &window.app_name, &icons_dir)
                    {
                        processes_exes.insert(window.app_name.clone());

                        let icon_url = format!(
                            "asset://icons/{}",
                            icon_path
                                .file_name()
                                .and_then(|n| n.to_str())
                                .unwrap_or("unknown.png")
                        );

                        app_icons.insert(window.app_name.clone(), icon_url);
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

unsafe extern "system" fn enum_windows_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
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

    let mut title: [u16; 512] = [0; 512];
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

    let process_handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
    let mut app_name = String::from("Unknown");

    if let Ok(handle) = process_handle {
        let mut exe_path: [u16; 512] = [0; 512];
        let mut size = exe_path.len() as u32;

        if QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_WIN32,
            PWSTR(exe_path.as_mut_ptr()),
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

fn extract_exe_icon_to_png(exe_path: &str, app_name: &str, icons_dir: &Path) -> Option<PathBuf> {
    unsafe {
        let hicon = extract_icon_from_exe(exe_path)?;

        let safe_name = app_name
            .replace(".exe", "")
            .replace(|c: char| !c.is_alphabetic() && c != '-' && c != '_', "_");
        let output_path = icons_dir.join(format!("{}.png", safe_name));

        icon_to_png(hicon, &output_path)?;

        let _ = DestroyIcon(hicon);

        Some(output_path)
    }
}

unsafe fn extract_icon_from_exe(exe_path: &str) -> Option<HICON> {
    let path_wide: Vec<u16> = exe_path.encode_utf16().chain(std::iter::once(0)).collect();
    let hicon = ExtractIconW(
        Some(HINSTANCE::default()),
        PWSTR::from_raw(path_wide.as_ptr() as *mut _),
        0,
    );

    if hicon.0 as usize <= 1 {
        return None;
    }

    Some(hicon)
}

unsafe fn icon_to_png(hicon: HICON, output_path: &Path) -> Option<()> {
    // Get icon info - bitmaps for color and mask
    let mut icon_info = ICONINFO::default();
    if GetIconInfo(hicon, &mut icon_info).is_err() {
        return None;
    }

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
    let hdc = GetDC(Some(HWND(0 as _)));
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
    let hbm_dib = CreateDIBSection(Some(hdc_mem), &bmi, DIB_RGB_COLORS, &mut bits, None, 0).ok()?;

    let old_bm = SelectObject(hdc_mem, hbm_dib.into());

    // Render icon into memory DC
    if DrawIconEx(
        hdc_mem,
        0,
        0,
        hicon,
        width as i32,
        height as i32,
        0,
        None,
        DI_NORMAL,
    )
    .is_err()
    {
        return None;
    }

    // Copy pixel data from DIB into image buffer
    let pixel_count = (width * height) as usize;
    let pixel_data = std::slice::from_raw_parts(bits as *const u8, pixel_count * 4);

    let mut img_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(width, height);
    for (i, pixel) in img_buffer.pixels_mut().enumerate() {
        let offset = i * 4;
        pixel.0 = [
            pixel_data[offset + 2], // R
            pixel_data[offset + 1], // G
            pixel_data[offset],     // B
            pixel_data[offset + 3], // A
        ]
    }

    // Save image as a PNG
    img_buffer.save(output_path).ok()?;

    // Cleanup GDI objects and DCs
    SelectObject(hdc_mem, old_bm);
    let _ = DeleteObject(hbm_dib.into());
    let _ = DeleteObject(icon_info.hbmColor.into());
    let _ = DeleteObject(icon_info.hbmMask.into());
    let _ = DeleteDC(hdc_mem);
    ReleaseDC(Some(HWND(0 as _)), hdc);

    Some(())
}

unsafe fn get_exe_path_from_hwnd(hwnd: HWND) -> Option<String> {
    let mut pid: u32 = 0;
    GetWindowThreadProcessId(hwnd, Some(&mut pid));

    let process_handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;

    let mut exe_path: [u16; 512] = [0; 512];
    let mut size = exe_path.len() as u32;

    if QueryFullProcessImageNameW(
        process_handle,
        PROCESS_NAME_WIN32,
        PWSTR(exe_path.as_mut_ptr()),
        &mut size,
    )
    .is_ok()
    {
        let _ = CloseHandle(process_handle);
        Some(String::from_utf16_lossy(&exe_path[..size as usize]))
    } else {
        let _ = CloseHandle(process_handle);
        None
    }
}
