export interface DesktopNotification {
  id: number;
  app_name: string;
  replaces_id: number;
  icon: string;
  summary: string;
  body: string;
  actions: Array<{ id: number; label: string }>;
  hints: any[];
  timeout: number;
  image?: string;
  seen: boolean;
}

export const useNotifications = defineStore("notifications", () => {
  const notifications = ref<DesktopNotification[]>([]);

  window.$electron.onEvent(
    "notification",
    (_, notification: DesktopNotification) => {
      switch(notification.app_name) {
        case 'discord': {
          const match = notification.summary.match(/(.*) \((#(.*)), (.*)\)/)
          if (match) {
            notification.summary = `${match[1]} (${match[2]})`;
          }
          
          notification.body = 'New message';
          break;
        }
        case 'Signal': {
          notification.body = 'New message';
          break;
        }
      }

      notifications.value.push({ ...notification, seen: false });
    }
  );

  window.$electron.onEvent("close-notification", (_, id: number) => {
    close(id);
  });

  function read(id: number) {
    const index = notifications.value.findIndex((x) => x.id === id);
    if (index === -1) return;
    notifications.value[index]!.seen = true;
  }

  function close(id: number) {
    const index = notifications.value.findIndex((x) => x.id === id);
    if (index === -1) return;
    notifications.value.splice(index, 1);
  }

  function clear() {
    notifications.value.length = 0;
  }

  return { notifications, close, clear };
});
