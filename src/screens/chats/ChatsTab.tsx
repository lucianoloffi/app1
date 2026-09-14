import { useAppState } from '../../state/AppState'
import ChatsListScreen from './ChatsListScreen'
import ChatConversationScreen from './ChatConversationScreen'

export default function ChatsTab() {
  const { chatId } = useAppState()
  return chatId ? <ChatConversationScreen /> : <ChatsListScreen />
}
