import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';
import {
  AIResponse,
  ConversationContext,
  IntentType,
  ToolCall,
  MenuItem,
} from './interfaces/ai.interface';
import { SYSTEM_PROMPT, TOOLS, FEW_SHOT_EXAMPLES } from './prompts/system-prompt';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
      });
    } else {
      this.logger.warn('OPENAI_API_KEY not configured. AI features will use mock responses.');
    }
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    sessionId: string,
    message: string,
    channel: string,
    userId?: string,
  ): Promise<AIResponse> {
    // Get or create conversation context
    const context = await this.getOrCreateContext(sessionId, userId, channel);

    // Add user message to history
    context.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Keep only last 10 messages to avoid token limits
    if (context.conversationHistory.length > 10) {
      context.conversationHistory = context.conversationHistory.slice(-10);
    }

    // Get menu for context
    const menuItems = await this.getMenuItems();

    // Build messages for OpenAI
    const messages = this.buildMessages(context, message, menuItems);

    try {
      // Call OpenAI if configured
      if (this.openai) {
        const response = await this.callOpenAI(messages);
        return this.processAIResponse(response, context, channel);
      } else {
        // Fallback to rule-based responses
        return this.generateMockResponse(message, context, menuItems, channel);
      }
    } catch (error) {
      this.logger.error('AI processing error:', error);
      
      // Fallback to mock response
      return this.generateMockResponse(message, context, menuItems, channel);
    }
  }

  /**
   * Build conversation messages for OpenAI
   */
  private buildMessages(
    context: ConversationContext,
    userMessage: string,
    menuItems: MenuItem[],
  ) {
    const messages: any[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...FEW_SHOT_EXAMPLES,
      {
        role: 'system',
        content: `\nCURRENT MENU (only recommend these items):\n${JSON.stringify(menuItems, null, 2)}`,
      },
      ...context.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    return messages;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(messages: any[]) {
    const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const temperature = parseFloat(this.configService.get<string>('AI_TEMPERATURE', '0.7'));
    const maxTokens = parseInt(this.configService.get<string>('AI_MAX_TOKENS', '500'));

    const response = await this.openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      tools: TOOLS,
      tool_choice: 'auto',
    });

    return response.choices[0].message;
  }

  /**
   * Process OpenAI response
   */
  private async processAIResponse(
    message: any,
    context: ConversationContext,
    channel: string,
  ): Promise<AIResponse> {
    const response: AIResponse = {
      reply: message.content || '',
      intent: 'unknown',
      toolCalls: [],
    };

    // Extract tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        response.toolCalls?.push({
          name: functionName,
          arguments: functionArgs,
        });

        // Execute tool and get result
        const toolResult = await this.executeTool(functionName, functionArgs, context, channel);

        // Append tool result to conversation
        context.conversationHistory.push({
          role: 'assistant',
          content: `[Tool: ${functionName}] Executed`,
          timestamp: new Date(),
        });
      }
    }

    // Detect intent from response
    response.intent = this.detectIntent(message.content || '', response.toolCalls);

    // Save context
    await this.saveContext(context);

    return response;
  }

  /**
   * Execute tool function
   */
  private async executeTool(
    toolName: string,
    args: any,
    context: ConversationContext,
    channel: string,
  ): Promise<any> {
    switch (toolName) {
      case 'getMenu':
        return this.getMenuItems(args.category, args.search);

      case 'getMenuItem':
        return this.getMenuItemById(args.itemId);

      case 'createOrder':
        return this.createOrderFromAI(args, context, channel);

      case 'getPromos':
        return this.getActivePromos(args.channel);

      case 'getOrderStatus':
        return this.getOrderStatus(args.orderId);

      case 'getBusinessHours':
        return this.getBusinessHours();

      default:
        return { error: 'Unknown tool' };
    }
  }

  /**
   * Get menu items
   */
  private async getMenuItems(category?: string, search?: string) {
    const items = await this.prisma.menuItem.findMany({
      where: {
        isActive: true,
        ...(category && {
          category: {
            name: { contains: category, mode: 'insensitive' },
          },
        }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category.name,
      isPopular: item.isPopular,
      isFeatured: item.isFeatured,
      tags: item.tags,
      options: item.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        type: opt.type,
        required: opt.required,
        values: opt.values.map((val) => ({
          id: val.id,
          value: val.value,
          priceModifier: val.priceModifier,
          isDefault: val.isDefault,
        })),
      })),
    }));
  }

  /**
   * Get single menu item
   */
  private async getMenuItemById(itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
    });

    if (!item) {
      return { error: 'Item not found' };
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category.name,
      isPopular: item.isPopular,
      isFeatured: item.isFeatured,
      tags: item.tags,
      options: item.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        type: opt.type,
        required: opt.required,
        values: opt.values.map((val) => ({
          id: val.id,
          value: val.value,
          priceModifier: val.priceModifier,
          isDefault: val.isDefault,
        })),
      })),
    };
  }

  /**
   * Create order from AI conversation
   */
  private async createOrderFromAI(
    args: any,
    context: ConversationContext,
    channel: string,
  ) {
    try {
      const order = await this.prisma.order.create({
        data: {
          userId: context.userId || null,
          orderNumber: await this.generateOrderNumber(),
          status: 'PENDING',
          channel: channel as any,
          tableNumber: args.tableNumber,
          customerName: args.customerName,
          customerPhone: args.customerPhone,
          customerNotes: args.customerNotes,
          subtotal: 0,
          discount: 0,
          tax: 0,
          serviceFee: 0,
          totalPrice: 0,
          items: {
            create: args.items.map((item: any) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: 0,
              totalPrice: 0,
              notes: item.notes,
              options: item.options
                ? {
                    create: item.options.map((opt: any) => ({
                      optionValueId: opt.optionValueId,
                      priceModifier: 0,
                    })),
                  }
                : undefined,
            })),
          },
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
      });

      // Update context with order
      context.currentOrder = {
        items: order.items.map((item) => ({
          itemId: item.itemId,
          name: item.item.name,
          quantity: item.quantity,
          options: [],
        })),
        subtotal: 0,
      };

      return { success: true, orderId: order.id, orderNumber: order.orderNumber };
    } catch (error) {
      this.logger.error('Error creating order:', error);
      return { success: false, error: 'Failed to create order' };
    }
  }

  /**
   * Get active promos
   */
  private async getActivePromos(channel?: string) {
    const promos = await this.prisma.promo.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        ...(channel && {
          applicableChannels: {
            has: channel as any,
          },
        }),
      },
    });

    return promos.map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      type: p.type,
      value: p.value,
      valueType: p.valueType,
      minPurchase: p.minPurchase,
    }));
  }

  /**
   * Get order status
   */
  private async getOrderStatus(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!order) {
      return { error: 'Order not found' };
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.totalPrice,
      items: order.items.map((item) => ({
        name: item.item.name,
        quantity: item.quantity,
      })),
      createdAt: order.createdAt,
    };
  }

  /**
   * Get business hours
   */
  private async getBusinessHours() {
    const settings = await this.prisma.systemSetting.findUnique({
      where: { key: 'operating_hours' },
    });

    return settings?.value || {
      message: 'Business hours not configured',
    };
  }

  /**
   * Generate order number
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `ORD-${dateStr}-${sequence}`;
  }

  /**
   * Detect intent from message
   */
  private detectIntent(message: string, toolCalls?: ToolCall[]): IntentType {
    const lowerMessage = message.toLowerCase();

    // Check tool calls first
    if (toolCalls && toolCalls.length > 0) {
      if (toolCalls.some((tc) => tc.name === 'createOrder')) {
        return 'order';
      }
      if (toolCalls.some((tc) => tc.name === 'getPromos')) {
        return 'promo';
      }
      if (toolCalls.some((tc) => tc.name === 'getOrderStatus')) {
        return 'faq';
      }
    }

    // Keyword-based intent detection
    if (lowerMessage.includes('pesan') || lowerMessage.includes('order') || lowerMessage.includes('beli')) {
      return 'order';
    }
    if (lowerMessage.includes('rekomendasi') || lowerMessage.includes('saran')) {
      return 'recommendation';
    }
    if (lowerMessage.includes('promo') || lowerMessage.includes('diskon')) {
      return 'promo';
    }
    if (lowerMessage.includes('halo') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      return 'greeting';
    }
    if (lowerMessage.includes('komplain') || lowerMessage.includes('masalah')) {
      return 'complaint';
    }
    if (lowerMessage.includes('konfirmasi') || lowerMessage.includes('ya') || lowerMessage.includes('oke')) {
      return 'confirmation';
    }

    return 'unknown';
  }

  /**
   * Get or create conversation context
   */
  private async getOrCreateContext(
    sessionId: string,
    userId?: string,
    channel?: string,
  ): Promise<ConversationContext> {
    let session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      session = await this.prisma.session.create({
        data: {
          id: sessionId,
          userId: userId || null,
          channel: (channel as any) || 'WEB',
          context: {},
          isActive: true,
        },
      });
    }

    const context: ConversationContext = {
      sessionId: session.id,
      userId: session.userId || undefined,
      channel: session.channel,
      currentOrder: (session.context as any)?.currentOrder,
      lastMessage: (session.context as any)?.lastMessage,
      conversationHistory: (session.context as any)?.conversationHistory || [],
      preferences: (session.context as any)?.preferences,
    };

    return context;
  }

  /**
   * Save conversation context
   */
  private async saveContext(context: ConversationContext) {
    await this.prisma.session.update({
      where: { id: context.sessionId },
      data: {
        context: {
          currentOrder: context.currentOrder,
          lastMessage: context.lastMessage,
          conversationHistory: context.conversationHistory,
          preferences: context.preferences,
        },
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Generate mock response (fallback when OpenAI not configured)
   */
  private generateMockResponse(
    message: string,
    context: ConversationContext,
    menuItems: MenuItem[],
    channel: string,
  ): AIResponse {
    const lowerMessage = message.toLowerCase();

    // Simple rule-based responses
    if (lowerMessage.includes('halo') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      return {
        reply: 'Halo! ☕ Selamat datang di AI Coffee Shop. Ada yang bisa saya bantu hari ini?',
        intent: 'greeting',
        shouldEndConversation: false,
      };
    }

    if (lowerMessage.includes('menu') || lowerMessage.includes('pesan') || lowerMessage.includes('order')) {
      const popularItems = menuItems.filter((item) => item.isPopular).slice(0, 5);
      const menuList = popularItems
        .map((item) => `- ${item.name}: Rp ${item.price.toLocaleString('id-ID')}`)
        .join('\n');

      return {
        reply: `Berikut menu populer kami:\n\n${menuList}\n\nMau pesan apa?`,
        intent: 'order',
        shouldEndConversation: false,
      };
    }

    if (lowerMessage.includes('rekomendasi') || lowerMessage.includes('saran')) {
      const popularItem = menuItems.find((item) => item.isPopular);
      return {
        reply: `Saya rekomendasikan ${popularItem?.name || 'Cappuccino'} kami! Ini favorit pelanggan. Mau coba?`,
        intent: 'recommendation',
        shouldEndConversation: false,
      };
    }

    if (lowerMessage.includes('promo') || lowerMessage.includes('diskon')) {
      return {
        reply: 'Kami ada promo WELCOME10 untuk diskon 10% pembelian pertama! Mau pakai?',
        intent: 'promo',
        shouldEndConversation: false,
      };
    }

    // Default response
    return {
      reply: 'Maaf, saya kurang paham. Bisa diulang lebih detail? Atau mau lihat menu kami?',
      intent: 'unknown',
      shouldEndConversation: false,
    };
  }
}
