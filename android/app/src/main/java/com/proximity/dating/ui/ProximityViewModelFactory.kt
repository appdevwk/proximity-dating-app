package com.proximity.dating.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

/**
 * Minimal factory for ViewModels with constructor dependencies, wiring them
 * straight to the application's [com.proximity.dating.data.AppContainer].
 */
class ProximityViewModelFactory<T : ViewModel>(
    private val creator: () -> T,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <VM : ViewModel> create(modelClass: Class<VM>): VM = creator() as VM
}