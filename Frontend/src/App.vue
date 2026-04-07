<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from './services/api'
import { useAlerts } from './composables/useAlerts'

import Dashboard from './views/Dashboard.vue'
import GroupsPage from './views/GroupsPage.vue'
import ToastContainer from './components/ToastContainer.vue'
import AlertModal from './components/AlertModal.vue'
import LoadingScreen from './components/LoadingScreen.vue'

const devices = ref([])
const currentPage = ref(getPageFromHash())
const isReloadingPage = ref(false)
let pollingId = null

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '')
  return hash === 'groups' ? 'groups' : 'dashboard'
}

function syncDevices(apiDevices) {
  // Preserva o acknowledge local entre polls para o modal não reaparecer a cada refresh.
  const acknowledgedById = new Map(
    devices.value.map(device => [device.id, device.acknowledged])
  )

  devices.value = apiDevices.map(device => ({
    ...device,
    acknowledged: acknowledgedById.get(device.id) ?? device.online
  }))
}

async function loadDevices(showReloadScreen = false) {
  try {
    if (showReloadScreen) {
      isReloadingPage.value = true
    }

    const response = await api.get('/devices')
    syncDevices(response.data)
  } finally {
    if (showReloadScreen) {
      isReloadingPage.value = false
    }
  }
}

async function reloadDevices() {
  await loadDevices(true)
}

function navigateTo(page) {
  currentPage.value = page
  window.location.hash = page
}

function handleHashChange() {
  currentPage.value = getPageFromHash()
}

function requestNotificationPermission() {
  if (!('Notification' in window)) return

  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

const offlineCount = computed(() =>
  devices.value.filter(device => !device.online).length
)

const { alerts, acknowledgeAll, unacknowledgedOffline } = useAlerts(devices)

onMounted(() => {
  if (!window.location.hash) {
    window.location.hash = 'dashboard'
  }

  loadDevices(true)
  // Mantém a tela atualizada sem exigir refresh manual depois de eventos do backend.
  pollingId = window.setInterval(loadDevices, 5000)
  window.addEventListener('hashchange', handleHashChange)
  requestNotificationPermission()
})

onBeforeUnmount(() => {
  if (pollingId) {
    window.clearInterval(pollingId)
  }

  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header ui-surface">
      <div class="app-header__brand">
        <p class="app-header__eyebrow">Verificador de Ping</p>
        <h1>Monitoramento</h1>
      </div>

      <div class="app-header__meta">
        <div class="app-header__chips">
          <span class="ui-chip ui-chip--danger">
            {{ offlineCount }} offline
          </span>
          <span class="ui-chip">
            {{ devices.length }} dispositivos
          </span>
        </div>

        <nav class="app-nav" aria-label="Páginas">
          <button
            type="button"
            class="app-nav__button"
            :class="{ 'app-nav__button--active': currentPage === 'dashboard' }"
            @click="navigateTo('dashboard')"
          >
            Dashboard
          </button>

          <button
            type="button"
            class="app-nav__button"
            :class="{ 'app-nav__button--active': currentPage === 'groups' }"
            @click="navigateTo('groups')"
          >
            Grupos
          </button>
        </nav>
      </div>
    </header>

    <main class="app-content">
      <Dashboard
        v-if="currentPage === 'dashboard'"
        :devices="devices"
      />

      <GroupsPage
        v-else
        :devices="devices"
        @added="reloadDevices"
        @changed="reloadDevices"
      />
    </main>

    <ToastContainer :alerts="alerts" />

    <AlertModal
      v-if="unacknowledgedOffline.length"
      :devices="unacknowledgedOffline"
      @ack="acknowledgeAll"
    />

    <LoadingScreen
      :visible="isReloadingPage"
      message="Recarregando página..."
    />
  </div>
</template>
