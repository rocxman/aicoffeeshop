export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AIResponse {
  reply: string;
  intent: IntentType;
  entities?: Record<string, any>;
  toolCalls?: ToolCall[];
  shouldEndConversation?: boolean;
}

export type IntentType = 
  | 'order'
  | 'recommendation'
  | 'faq'
  | 'complaint'
  | 'promo'
  | 'greeting'
  | 'confirmation'
  | 'unknown';

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  channel: string;
  currentOrder?: {
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      options?: Array<{
        optionId: string;
        valueId: string;
        name: string;
        value: string;
        priceModifier: number;
      }>;
    }>;
    subtotal: number;
  };
  lastMessage?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  preferences?: {
    favoriteItems?: string[];
    dietaryRestrictions?: string[];
    preferredSize?: string;
    preferredSugarLevel?: string;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  isPopular: boolean;
  isFeatured: boolean;
  tags: string[];
  options?: MenuOption[];
}

export interface MenuOption {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  values: MenuOptionValue[];
}

export interface MenuOptionValue {
  id: string;
  value: string;
  priceModifier: number;
  isDefault: boolean;
}
