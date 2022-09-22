import AppKit

@objc
public enum AppThemeType: Int {
	case light = 0;
	case dark = 1;
}

@_cdecl("lock_app_theme")
public func lockAppTheme(themeType: AppThemeType) {
	var theme: NSAppearance;

	switch themeType {
		case .dark:
			theme = NSAppearance(named: .darkAqua)!;
		case .light:
			theme = NSAppearance(named: .aqua)!;
	}

	NSApp.appearance = theme;
}

@_cdecl("blur_window_background")
public func blurWindowBackground(window: NSWindow) {
	let windowContent = window.contentView!;
	let blurryView = NSVisualEffectView();
	
	blurryView.material = .sidebar;
	blurryView.state = .followsWindowActiveState;
	blurryView.blendingMode = .behindWindow;
	blurryView.wantsLayer = true;

	window.contentView = blurryView;
	blurryView.addSubview(windowContent);
}

@_cdecl("set_invisible_toolbar")
public func setInvisibleToolbar(window: NSWindow, hasToolbar: Bool) {
	if !hasToolbar {
		window.toolbar = nil;
		return;
	}

	let toolbar = NSToolbar(identifier: "window_invisible_toolbar");

	toolbar.showsBaselineSeparator = false;
	window.toolbar = toolbar;
}

@_cdecl("set_titlebar_style")
public func setTitlebarStyle(window: NSWindow, transparent: Bool, large: Bool) {
	var styleMask = window.styleMask;

	if transparent && large {
		styleMask.insert(.unifiedTitleAndToolbar);
	}

	window.styleMask = styleMask;

	if large {
		setInvisibleToolbar(window: window, hasToolbar: true);
	}

	window.titleVisibility = transparent ? .hidden : .visible;
	window.titlebarAppearsTransparent = transparent;
}
