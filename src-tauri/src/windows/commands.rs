use serde::Serialize;
use windows::{
    core::{BOOL, PWSTR},
    Win32::{
        Foundation::{CloseHandle, HWND, LPARAM},
        Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_CLOAKED},
        System::Threading::{
            OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
            PROCESS_QUERY_LIMITED_INFORMATION,
        },
        UI::WindowsAndMessaging::{
            EnumWindows, GetWindowLongW, GetWindowTextW, GetWindowThreadProcessId, IsWindowVisible,
            GWL_EXSTYLE, WS_EX_TOOLWINDOW,
        },
    },
};

#[derive(Serialize, Debug)]
pub struct WindowInfo {
    title: String,
    app_name: String,
    hwnd: isize,
}

#[tauri::command]
pub async fn list_windows() -> Result<Vec<WindowInfo>, String> {
    let mut windows = get_visible_windows();

    windows.sort_by(|a, b| {
        a.app_name
            .to_lowercase()
            .cmp(&b.app_name.to_lowercase())
            .then_with(|| a.title.cmp(&b.title))
    });

    Ok(windows)
}

fn get_visible_windows() -> Vec<WindowInfo> {
    unsafe {
        let mut windows: Vec<WindowInfo> = Vec::new();
        let _ = EnumWindows(
            Some(enum_windows_callback),
            LPARAM(&mut windows as *mut _ as isize),
        );

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

    // Exclude this application itself
    if app_name == "clip-mark.exe" {
        return true.into();
    }

    windows.push(WindowInfo {
        title,
        app_name,
        hwnd: hwnd.0 as isize,
    });
    true.into()
}
