import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import ConnectedUsersSideBar from "../ConnectedUsersSideBar.vue";
import { serverService } from "../../services/server";
import { socketService } from "../../services/socket";
import { authState } from "../../services/auth";

const notificationHandlers = new Map();

vi.mock("../../services/server", () => ({
  serverService: {
    getServerUsers: vi.fn(),
  },
}));

vi.mock("../../services/socket", () => ({
  socketService: {
    on: vi.fn((type, callback) => {
      notificationHandlers.set(type, callback);
    }),
    off: vi.fn((type, callback) => {
      if (notificationHandlers.get(type) === callback) {
        notificationHandlers.delete(type);
      }
    }),
  },
}));

describe("ConnectedUsersSideBar.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationHandlers.clear();
    authState.user = { id: "user-1", username: "Alice" };
  });

  it("renders an empty state when no server is selected", () => {
    const wrapper = mount(ConnectedUsersSideBar);

    expect(wrapper.text()).toContain("Choose a server to see who is online.");
    expect(wrapper.text()).toContain("Connected Users");
  });

  it("loads and groups users by presence for the selected server", async () => {
    serverService.getServerUsers.mockResolvedValueOnce([
      { id: "user-1", username: "Alice", isOnline: true },
      { id: "user-2", username: "Bob", isOnline: false },
      { id: "user-3", username: "Charlie", isOnline: true },
    ]);

    const wrapper = mount(ConnectedUsersSideBar, {
      props: {
        selectedServer: { id: "server-1", name: "Sky Lounge" },
      },
    });

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(serverService.getServerUsers).toHaveBeenCalledWith("server-1");
    expect(wrapper.text()).toContain("ONLINE — 2");
    expect(wrapper.text()).toContain("OFFLINE — 1");
    expect(wrapper.text()).toContain("Alice");
    expect(wrapper.text()).toContain("Bob");
    expect(wrapper.text()).toContain("Charlie");
    expect(wrapper.text()).toContain("You");
    expect(wrapper.findAll(".user-item").length).toBe(3);
    expect(socketService.on).toHaveBeenCalledWith(
      "server:user-presence-changed",
      expect.any(Function),
    );
  });

  it("updates a member when a presence notification arrives", async () => {
    serverService.getServerUsers.mockResolvedValueOnce([
      { id: "user-1", username: "Alice", isOnline: false },
      { id: "user-2", username: "Bob", isOnline: false },
    ]);

    const wrapper = mount(ConnectedUsersSideBar, {
      props: {
        selectedServer: { id: "server-1", name: "Sky Lounge" },
      },
    });

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const presenceHandler = notificationHandlers.get(
      "server:user-presence-changed",
    );
    expect(presenceHandler).toBeTypeOf("function");

    await presenceHandler({
      serverId: "server-1",
      userId: "user-2",
      isOnline: true,
    });

    await nextTick();

    expect(wrapper.text()).toContain("ONLINE — 1");
    expect(wrapper.text()).toContain("OFFLINE — 1");
    expect(wrapper.text()).toContain("Bob");
  });
});
