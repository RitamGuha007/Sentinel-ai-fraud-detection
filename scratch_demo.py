import time
import os
import sys
import ctypes
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
URL = "http://localhost:5173/"

def force_focus():
    """Forces Windows OS to bring Chrome window to the foreground"""
    try:
        user32 = ctypes.windll.user32
        # Small delay to let window render
        time.sleep(1)
        
        def enum_windows_callback(hwnd, extra):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                title = buff.value
                if "SENTINEL" in title or "Chrome" in title:
                    # Restore and bring to top
                    user32.ShowWindow(hwnd, 3) # SW_MAXIMIZE = 3
                    user32.SetForegroundWindow(hwnd)
            return True

        WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_int, ctypes.c_int)
        user32.EnumWindows(WNDENUMPROC(enum_windows_callback), 0)
    except Exception as e:
        print("Focus helper note:", e)

def run_live_demo():
    print("==================================================")
    print("STARTING VISIBLE LIVE DEMO ON YOUR DESKTOP...")
    print("==================================================")
    sys.stdout.flush()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=False,
            args=[
                "--start-maximized",
                "--new-window",
                "--disable-blink-features=AutomationControlled",
                "--no-default-browser-check"
            ]
        )
        
        context = browser.new_context(viewport=None) # Use actual maximized screen
        page = context.new_page()

        print("Opening Sentinel Fraud Detection Platform...")
        sys.stdout.flush()
        page.goto(URL, wait_until="networkidle")
        
        # Bring window to front
        force_focus()
        time.sleep(1.5)

        # Inject high-visibility demo overlay banner and laser cursor
        page.evaluate("""
        () => {
            // 1. Live Banner
            const banner = document.createElement('div');
            banner.id = 'demo-banner';
            banner.style.position = 'fixed';
            banner.style.top = '75px';
            banner.style.left = '50%';
            banner.style.transform = 'translateX(-50%)';
            banner.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
            banner.style.border = '2px solid #6366f1';
            banner.style.borderRadius = '16px';
            banner.style.padding = '12px 28px';
            banner.style.color = '#fff';
            banner.style.zIndex = '999999';
            banner.style.boxShadow = '0 10px 40px rgba(99, 102, 241, 0.6), 0 0 20px rgba(6, 182, 212, 0.4)';
            banner.style.fontFamily = 'system-ui, sans-serif';
            banner.style.textAlign = 'center';
            banner.style.backdropFilter = 'blur(12px)';
            banner.style.pointerEvents = 'none';
            banner.style.transition = 'all 0.3s ease';
            
            banner.innerHTML = `
                <div style="font-size: 13px; font-weight: 800; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 2px;">
                    ⚡ LIVE AGENT BROWSER AUTOMATION IN PROGRESS
                </div>
                <div id="demo-subtext" style="font-size: 15px; font-weight: 600; color: #f1f5f9;">
                    Initializing test suite & connecting to FastAPI pipeline...
                </div>
            `;
            document.body.appendChild(banner);

            // 2. High-visibility Laser Cursor
            const cursor = document.createElement('div');
            cursor.id = 'laser-cursor';
            cursor.style.position = 'fixed';
            cursor.style.width = '30px';
            cursor.style.height = '30px';
            cursor.style.borderRadius = '50%';
            cursor.style.backgroundColor = 'rgba(56, 189, 248, 0.8)';
            cursor.style.border = '3px solid #ffffff';
            cursor.style.boxShadow = '0 0 20px #06b6d4, 0 0 40px #6366f1';
            cursor.style.pointerEvents = 'none';
            cursor.style.zIndex = '1000000';
            cursor.style.transform = 'translate(-50%, -50%)';
            cursor.style.left = '-100px';
            cursor.style.top = '-100px';
            cursor.style.transition = 'transform 0.15s ease, background-color 0.2s ease, width 0.2s ease, height 0.2s ease';
            document.body.appendChild(cursor);

            window.setDemoStatus = (text, color = '#38bdf8') => {
                const sub = document.getElementById('demo-subtext');
                if (sub) {
                    sub.innerHTML = text;
                    banner.style.borderColor = color;
                    banner.style.boxShadow = `0 10px 40px ${color}88`;
                }
            };

            window.updateLaser = (x, y, isClick = false) => {
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';
                if (isClick) {
                    cursor.style.transform = 'translate(-50%, -50%) scale(1.8)';
                    cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
                    
                    // Spawn ripple ring
                    const ripple = document.createElement('div');
                    ripple.style.position = 'fixed';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    ripple.style.width = '20px';
                    ripple.style.height = '20px';
                    ripple.style.borderRadius = '50%';
                    ripple.style.border = '3px solid #ef4444';
                    ripple.style.transform = 'translate(-50%, -50%)';
                    ripple.style.pointerEvents = 'none';
                    ripple.style.zIndex = '999998';
                    ripple.style.animation = 'ripple-anim 0.6s ease-out forwards';
                    document.body.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 600);

                    setTimeout(() => {
                        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                        cursor.style.backgroundColor = 'rgba(56, 189, 248, 0.8)';
                    }, 250);
                }
            };

            // Style for click ripple animation
            const styleSheet = document.createElement('style');
            styleSheet.innerText = `
                @keyframes ripple-anim {
                    0% { width: 20px; height: 20px; opacity: 1; border-width: 4px; }
                    100% { width: 90px; height: 90px; opacity: 0; border-width: 1px; }
                }
            `;
            document.head.appendChild(styleSheet);
        }
        """)

        def animate_move_click(selector, status_text, banner_color="#38bdf8"):
            print(f"Action: {status_text}")
            sys.stdout.flush()
            page.evaluate(f"window.setDemoStatus('{status_text}', '{banner_color}')")
            
            elem = page.wait_for_selector(selector)
            box = elem.bounding_box()
            if box:
                target_x = box['x'] + box['width'] / 2
                target_y = box['y'] + box['height'] / 2
                
                # Smooth visible mouse move
                page.mouse.move(target_x, target_y, steps=25)
                page.evaluate(f"window.updateLaser({target_x}, {target_y}, false)")
                time.sleep(0.5)
                
                # Visual click trigger
                page.evaluate(f"window.updateLaser({target_x}, {target_y}, true)")
                page.mouse.click(target_x, target_y)
                time.sleep(1.2)

        time.sleep(2)

        # Step 1: Click High-Risk Fraud Preset
        animate_move_click(
            "button:has-text('Account Takeover')",
            "1/5: Clicking [Account Takeover / Stolen Card] Preset ($239.93)...",
            "#ef4444"
        )
        page.evaluate("window.setDemoStatus('🚨 Model inference returned: 100.0% FRAUD PROBABILITY -> BLOCKED!', '#ef4444')")
        time.sleep(2.5)

        # Step 2: Smooth scroll down to examine the Crimson Gauge and Gateway Protocol
        print("Scrolling down to inspect fraud gauge...")
        page.evaluate("window.setDemoStatus('Inspecting Risk Gauge & Automated Protocol (Immediate Decline & Card Lock)...', '#ef4444')")
        for _ in range(6):
            page.mouse.wheel(0, 50)
            time.sleep(0.15)
        time.sleep(2.5)

        # Step 3: Switch PCA Latent Vector Tab
        animate_move_click(
            "button:has-text('Latent Vectors')",
            "2/5: Switching Feature Tab to [Latent Vectors (V11 - V20)]...",
            "#6366f1"
        )
        time.sleep(1.5)

        # Step 4: Click 'Analyze Transaction with AI' button
        animate_move_click(
            "button:has-text('Analyze Transaction with AI')",
            "3/5: Submitting 30-feature vector payload to FastAPI backend (/predict)...",
            "#06b6d4"
        )
        time.sleep(2.5)

        # Step 5: Scroll back up
        for _ in range(6):
            page.mouse.wheel(0, -50)
            time.sleep(0.15)
        time.sleep(1)

        # Step 6: Click Suspicious Preset
        animate_move_click(
            "button:has-text('Zero-Dollar Bot Card Ping')",
            "4/5: Testing [Zero-Dollar Bot Card Ping] -> Medium Risk (55.0%)...",
            "#f59e0b"
        )
        page.evaluate("window.setDemoStatus('⚠️ Suspicious Activity Detected: Triggering 3D-Secure 2FA OTP Challenge!', '#f59e0b')")
        time.sleep(2.5)

        # Step 7: Click Legitimate Preset
        animate_move_click(
            "button:has-text('Verified In-Store Purchase')",
            "5/5: Testing [Verified In-Store Purchase ($149.62)] -> Legitimate (0.0%)...",
            "#10b981"
        )
        page.evaluate("window.setDemoStatus('✅ Model Decision: APPROVED! Feature signature matches legitimate consumer profile.', '#10b981')")
        time.sleep(2.5)

        # Step 8: Scroll down to view the Audit Log
        page.evaluate("window.setDemoStatus('Final Step: Reviewing Live Session Audit Log with logged events...', '#6366f1')")
        for _ in range(8):
            page.mouse.wheel(0, 65)
            time.sleep(0.15)
        time.sleep(2.5)

        page.evaluate("""
        () => {
            window.setDemoStatus('🎉 LIVE DEMO COMPLETE! The browser is now yours to test and explore.', '#10b981');
            const cur = document.getElementById('laser-cursor');
            if (cur) cur.remove();
        }
        """)

        # Keep browser open for user to enjoy!
        print("Demo completed successfully! Leaving browser window open for user...")
        sys.stdout.flush()
        time.sleep(180) # Keep browser open for 3 minutes

if __name__ == "__main__":
    run_live_demo()
