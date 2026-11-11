package hr.blago.game;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.view.ViewParent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Default: status bar visible (0.9.167). Immersive only via BlagoFs.enter/toggle. */
    private boolean immersive = false;
    private static final int BLAGO_VOID = 0xFF2B1814;
    /** 0.9.178 (t459u): boje sustavnih traka = rub igre (default tema); JS ih mijenja po temi (BlagoFs.sustavneBoje). */
    private static final int BLAGO_NAV = 0xFF110905;
    private static final int BLAGO_STATUS = 0xFF26150D;
    private int navBoja = BLAGO_NAV;
    private int statusBoja = BLAGO_STATUS;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applySystemBars();
        hookBlagoFs();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (immersive) applyImmersive();
        else applySystemBars();
        hookBlagoFs();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        if (immersive) applyImmersive();
        else applySystemBars();
    }

    private void hookBlagoFs() {
        try {
            Bridge b = getBridge();
            if (b == null) return;
            WebView wv = b.getWebView();
            if (wv == null) return;
            stiliziraj(wv);
            wv.addJavascriptInterface(new BlagoFs(), "BlagoFs");
        } catch (Exception ignored) {
        }
    }

    private void stiliziraj(WebView wv) {
        wv.setBackgroundColor(BLAGO_VOID);
        wv.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        WebSettings postavke = wv.getSettings();
        if (Build.VERSION.SDK_INT >= 33) {
            postavke.setAlgorithmicDarkeningAllowed(false);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            postavke.setForceDark(WebSettings.FORCE_DARK_OFF);
        }
    }

    /** Visible status + nav bars, dark-brown background, light icons. */
    private void applySystemBars() {
        Window w = getWindow();
        if (w == null) return;
        // pozadina prozora = boja dna: ako sustav (Android 15+) crta traku prozirno, ispod je ista boja
        w.setBackgroundDrawable(new ColorDrawable(navBoja));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            w.setStatusBarColor(statusBoja);
            w.setNavigationBarColor(navBoja);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            w.setNavigationBarDividerColor(navBoja);
        }
        obojiRubWebViewa();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // bez sustavnog prozirnog "scrima" preko trake s tri gumba
            w.setNavigationBarContrastEnforced(false);
            w.setStatusBarContrastEnforced(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            w.setDecorFitsSystemWindows(true);
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                // Clear LIGHT appearance → light icons on dark bars (status + navigation)
                c.setSystemBarsAppearance(0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            }
        } else {
            View d = w.getDecorView();
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_VISIBLE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // do not set LIGHT_STATUS_BAR → light icons
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            d.setSystemUiVisibility(flags);
        }
    }

    /**
     * Android 15+ (targetSdk 35): sustav ne boji trake (prozirne su), a Capacitor SystemBars odmakne
     * WebView paddingom roditelja — ta traka pokazuje pozadinu roditelja. Gore = status, dolje = nav
     * (sredinu pokriva WebView). Na Androidu ≤ 14 isto vrijedi setStatusBarColor/setNavigationBarColor.
     */
    private void obojiRubWebViewa() {
        try {
            Bridge b = getBridge();
            if (b == null || b.getWebView() == null) return;
            ViewParent p = b.getWebView().getParent();
            if (!(p instanceof View)) return;
            GradientDrawable rub = new GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] { statusBoja, statusBoja, navBoja, navBoja }
            );
            ((View) p).setBackground(rub);
        } catch (Exception ignored) {
        }
    }

    private void applyImmersive() {
        Window w = getWindow();
        if (w == null) return;
        w.setBackgroundDrawable(new ColorDrawable(navBoja));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            w.setDecorFitsSystemWindows(false);
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            View d = w.getDecorView();
            d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
    }

    private void showBars() {
        immersive = false;
        applySystemBars();
    }

    public class BlagoFs {
        @JavascriptInterface
        public boolean isImmersive() {
            return immersive;
        }

        @JavascriptInterface
        public void enter() {
            runOnUiThread(() -> {
                immersive = true;
                applyImmersive();
            });
        }

        @JavascriptInterface
        public void exit() {
            runOnUiThread(() -> {
                immersive = false;
                showBars();
            });
        }

        /** 0.9.178: "#RRGGBB" za statusnu i navigacijsku traku (tema igre). Neispravna boja se zanemaruje. */
        @JavascriptInterface
        public void sustavneBoje(String status, String nav) {
            final int st;
            final int nv;
            try {
                st = 0xFF000000 | (Color.parseColor(status) & 0xFFFFFF);
                nv = 0xFF000000 | (Color.parseColor(nav) & 0xFFFFFF);
            } catch (Exception e) {
                return;
            }
            runOnUiThread(() -> {
                statusBoja = st;
                navBoja = nv;
                if (immersive) applyImmersive();
                else applySystemBars();
            });
        }

        @JavascriptInterface
        public void toggle() {
            runOnUiThread(() -> {
                immersive = !immersive;
                if (immersive) applyImmersive();
                else showBars();
            });
        }
    }
}
