package com.proximity.dating

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.proximity.dating.ui.navigation.ProximityNavGraph
import com.proximity.dating.ui.theme.ProximityDatingTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            ProximityDatingTheme {
                ProximityNavGraph()
            }
        }
    }
}