const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PushNotificationPayload {
  device_token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

async function sendFCMNotification(payload: PushNotificationPayload): Promise<boolean> {
  const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

  if (!fcmServerKey) {
    console.error("FCM_SERVER_KEY is not configured");
    return false;
  }

  const fcmUrl = "https://fcm.googleapis.com/fcm/send";

  const message = {
    to: payload.device_token,
    notification: {
      title: payload.title,
      body: payload.body,
      sound: "default",
      android_channel_id: "default",
    },
    data: payload.data || {},
    priority: "high",
  };

  try {
    const response = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        "Authorization": `key=${fcmServerKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("FCM error:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send FCM notification:", error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload = (await req.json()) as PushNotificationPayload;

    if (!payload.device_token || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const success = await sendFCMNotification(payload);

    return new Response(
      JSON.stringify({ success }),
      {
        status: success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
