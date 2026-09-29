import sys

path = '/home/ingri/my/Project/GameHUB/ClientGameHUB/components/shared/NavigationHeader.tsx'
with open(path, 'r') as f:
    content = f.read()

old_use_effect = """  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [user]);"""

new_use_effect = """  useEffect(() => {
    fetchNotifications();
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const baseURL = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const eventSource = new EventSource(`${baseURL}/Notification/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      if (event.data) {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_REVIEW') {
            fetchNotifications(); // Reload notifications on event
          }
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      }
    };

    return () => {
        eventSource.close();
    };
  }, [user]);"""

content = content.replace(old_use_effect, new_use_effect)

with open(path, 'w') as f:
    f.write(content)
