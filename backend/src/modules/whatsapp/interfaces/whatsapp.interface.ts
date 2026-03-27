export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion: string;
  baseURL: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'button' | 'interactive';
  text?: {
    body: string;
  };
  image?: {
    caption?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  audio?: {
    mime_type: string;
    sha256: string;
    id: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppMessage[];
        contacts?: WhatsAppContact[];
        statuses?: WhatsAppStatus[];
      };
      field: string;
    }[];
  }[];
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp: string;
    origin: {
      type: 'user_initiated' | 'business_initiated';
    };
  };
  pricing?: {
    pricing_model: 'CBP';
    billable: boolean;
    category: string;
  };
  errors?: {
    code: number;
    title: string;
    message: string;
    error_data: {
      details: string;
    };
  }[];
}

export interface WhatsAppSendMessageRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'template' | 'image' | 'interactive';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: {
      type: string;
      parameters: {
        type: string;
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
      }[];
    }[];
  };
  image?: {
    id?: string;
    link?: string;
    caption?: string;
  };
  interactive?: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    action?: {
      buttons?: {
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }[];
    };
  };
}

export interface WhatsAppSendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
}

export interface WhatsAppWebhookVerifyRequest {
  'hub.mode': 'subscribe' | 'unsubscribe';
  'hub.verify_token': string;
  'hub.challenge': string;
}
