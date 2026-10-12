import { Container } from "@mui/material";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useGroupChatRoom } from "./useGroupChatRoom";
import GroupChatRoom from "./GroupChatRoom";
import { disconnectGroupChatSocket } from "./groupChat.socket";

export default function GroupChatRoomPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { messages, sendMessage } = useGroupChatRoom(id);

  return (
    <Container maxWidth="sm" sx={{ mt: 2, height: "80vh" }}>
      <GroupChatRoom
        messages={messages}
        onSend={sendMessage}
        meta={location.state?.group}
        onClose={() => {
          disconnectGroupChatSocket();
          navigate(-1);
        }}
      />
    </Container>
  );
}
