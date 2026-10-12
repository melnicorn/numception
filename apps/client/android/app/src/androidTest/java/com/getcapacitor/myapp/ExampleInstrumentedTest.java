package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() throws Exception {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        // The package follows the last cap:sync: one of the appIds in apps/client/flavours.ts.
        String pkg = appContext.getPackageName();
        assertTrue(
            "unexpected package " + pkg,
            java.util.Arrays.asList("app.numception.dev", "app.numception.playtest", "app.numception").contains(pkg)
        );
    }
}
