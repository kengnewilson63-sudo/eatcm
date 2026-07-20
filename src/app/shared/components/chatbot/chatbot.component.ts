import { Component, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotComponent {
  isOpen  = signal(false);
  loading = signal(false);
  input   = signal('');
  erreur  = signal('');

  // CORRECTION — historique complet de la conversation
  messages = signal<Message[]>([
    {
      role: 'assistant',
      content: '👋 Bonjour ! Je suis l\'assistant EatsCM. Je peux t\'aider à trouver un restaurant, comprendre comment passer une commande, ou répondre à toutes tes questions sur l\'app. Comment puis-je t\'aider ?',
      timestamp: new Date(),
    }
  ]);

  readonly SYSTEM_PROMPT = `Tu es l'assistant virtuel d'EatsCM, une application de livraison de repas au Cameroun (Douala et Yaoundé).

Tu aides les utilisateurs avec :
- Trouver des restaurants par quartier ou type de cuisine camerounaise (ndolé, poulet DG, brochettes, eru...)
- Passer et suivre une commande
- Comprendre les modes de paiement (Orange Money, MTN MoMo, Cash)
- Frais de livraison : 0-3km = 1000 FCFA, 3-6km = 1500 FCFA, 6-10km = 2500 FCFA
- Gérer leur compte (client, restaurant, livreur)
- Résoudre les problèmes de livraison
- Annuler une commande (gratuit avant EN_PREPARATION)
- Comprendre les rôles : CLIENT commande, RESTAURANT vend, LIVREUR livre

Réponds toujours en français, de façon concise et amicale.
Si tu ne sais pas quelque chose, dis-le honnêtement.
Ne réponds qu'aux questions liées à EatsCM et à la livraison de repas.
Réponds en maximum 3 phrases sauf si l'utilisateur demande plus de détails.`;

  toggle(): void {
    this.isOpen.update(v => !v);
    // Scroll vers le bas à l'ouverture
    if (this.isOpen()) {
      setTimeout(() => this.scrollBas(), 100);
    }
  }

  onInput(e: Event): void {
    this.input.set((e.target as HTMLInputElement).value);
    this.erreur.set('');
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  async send(): Promise<void> {
    const text = this.input().trim();
    if (!text || this.loading()) return;

    // Ajoute le message utilisateur
    this.messages.update(m => [...m, {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }]);
    this.input.set('');
    this.loading.set(true);
    this.erreur.set('');

    setTimeout(() => this.scrollBas(), 50);

    try {
      // CORRECTION PRINCIPALE — envoie TOUT l'historique à chaque appel
      const historique = this.messages()
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: this.SYSTEM_PROMPT,
          // ✅ FIX — historique complet, pas juste le dernier message
          messages: historique,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Désolé, une erreur s'est produite.";

      // Ajoute la réponse de l'assistant
      this.messages.update(m => [...m, {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);

    } catch (err) {
      this.erreur.set('Connexion impossible. Vérifie ta connexion internet.');
      // Retire le dernier message utilisateur si erreur
    } finally {
      this.loading.set(false);
      setTimeout(() => this.scrollBas(), 50);
    }
  }

  // Vide la conversation
  reinitialiser(): void {
    this.messages.set([{
      role: 'assistant',
      content: '👋 Conversation réinitialisée. Comment puis-je t\'aider ?',
      timestamp: new Date(),
    }]);
    this.erreur.set('');
  }

  formatHeure(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollBas(): void {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }
}