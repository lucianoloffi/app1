import PhoneFrame from './components/PhoneFrame'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import { AppStateProvider, useAppState } from './state/AppState'
import OnboardingFlow from './screens/onboarding/OnboardingFlow'
import DiscoverScreen from './screens/discover/DiscoverScreen'
import ChatsTab from './screens/chats/ChatsTab'
import ProfileTabScreen from './screens/profile/ProfileTabScreen'
import FiltersScreen from './screens/FiltersScreen'
import ProfileDetailScreen from './screens/ProfileDetailScreen'
import MatchOverlay from './screens/MatchOverlay'
import SettingsScreen from './screens/settings/SettingsScreen'
import EditProfileScreen from './screens/profile/EditProfileScreen'
import ManagePhotosScreen from './screens/profile/ManagePhotosScreen'
import PermissionsScreen from './screens/settings/PermissionsScreen'
import BlockedProfilesScreen from './screens/settings/BlockedProfilesScreen'
import ChangeNumberScreen from './screens/settings/ChangeNumberScreen'
import ReportSheet from './screens/settings/ReportSheet'
import type { AppScreen } from './state/AppState'

const SCREEN_COMPONENTS: Record<AppScreen, React.ComponentType> = {
  filters: FiltersScreen,
  settings: SettingsScreen,
  edit: EditProfileScreen,
  managePhotos: ManagePhotosScreen,
  perms: PermissionsScreen,
  blocked: BlockedProfilesScreen,
  phoneChange: ChangeNumberScreen,
}

function AppShell() {
  const { stage, tab, chatId, detail, screenStack } = useAppState()

  if (stage === 'onboarding') {
    return (
      <PhoneFrame>
        <OnboardingFlow />
      </PhoneFrame>
    )
  }

  const showNav = !chatId && !detail && screenStack.length === 0

  return (
    <PhoneFrame>
      <div className="relative flex-1 min-h-0">
        {tab === 'discover' && <DiscoverScreen />}
        {tab === 'chats' && <ChatsTab />}
        {tab === 'profile' && <ProfileTabScreen />}

        {screenStack.map((s, i) => {
          const Screen = SCREEN_COMPONENTS[s]
          return <Screen key={`${s}-${i}`} />
        })}

        {detail && <ProfileDetailScreen />}
        <MatchOverlay />
        <ReportSheet />
        <Toast />
      </div>
      {showNav && <BottomNav />}
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  )
}
