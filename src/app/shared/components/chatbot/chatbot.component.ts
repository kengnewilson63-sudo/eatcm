import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

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

  /**
   * L'appel au modèle se fait via le backend (`POST /api/chatbot`).
   * Appeler api.anthropic.com directement depuis le navigateur était bloqué
   * par CORS et exposerait la clé API — le system prompt vit donc côté serveur
   * (voir ChatbotService.java).
   */
  private readonly apiChatbot = `${environment.apiUrl}/chatbot`;

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
      // Envoie TOUT l'historique : le backend gère le system prompt et l'appel au modèle
      const historique = this.messages()
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch(this.apiChatbot, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historique }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reponse ?? "Désolé, une erreur s'est produite.";

      // Ajoute la réponse de l'assistant
      this.messages.update(m => [...m, {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);

    } catch (err) {
      // Le backend n'est pas encore branché : on répond localement.
      this.messages.update(m => [...m, {
        role: 'assistant',
        content: this.reponseLocale(text),
        timestamp: new Date(),
      }]);
    } finally {
      this.loading.set(false);
      setTimeout(() => this.scrollBas(), 50);
    }
  }

  /**
   * Repli hors-ligne : petites réponses déterministes par mots-clés, utilisées
   * tant que `POST /api/chatbot` n'est pas disponible (pas de backend).
   */
  private reponseLocale(texte: string): string {
    const q = texte.toLowerCase();
    const a = (...mots: string[]) => mots.some(m => q.includes(m));

    if (a('bonjour', 'salut', 'hello', 'bonsoir')) {
      return '👋 Bonjour ! Je suis l\'assistant EatsCM. Je peux t\'aider à trouver un restaurant, passer une commande ou suivre une livraison. Que veux-tu savoir ?';
    }
    if (a('commander', 'commande', 'acheter', 'panier')) {
      return '🛒 Pour commander : ouvre un restaurant, ajoute des plats au panier, puis va dans le panier et valide le paiement (Mobile Money ou à la livraison).';
    }
    if (a('livraison', 'livreur', 'suivi', 'suivre', 'où est')) {
      return '🛵 La livraison est assurée par un livreur EatsCM. Tu peux suivre sa position en temps réel depuis la page « Suivi de commande » une fois ta commande validée.';
    }
    if (a('paiement', 'payer', 'momo', 'mobile money', 'mtn', 'orange')) {
      return '💳 Le paiement se fait par Mobile Money (MTN MoMo / Orange Money) ou en espèces à la livraison. Le montant est confirmé avant l\'envoi de la commande.';
    }
    if (a('restaurant', 'manger', 'plats', 'menu')) {
      return '🍽️ Tu peux explorer les restaurants depuis l\'accueil ou l\'onglet « Découvrir ». Filtre par catégorie ou par quartier pour trouver ton bonheur.';
    }
    if (a('inscription', 'compte', 'inscrire', 'mot de passe', 'connexion')) {
      return '🔑 Pour créer un compte ou te connecter, utilise les pages « Inscription » et « Connexion ». Un compte Restaurant ou Livreur doit être validé avant d\'être actif.';
    }
    if (a('merci', 'thanks')) {
      return 'Avec plaisir ! 🙌 Bonne dégustation sur EatsCM.';
    }
    return 'Je n\'ai pas encore la réponse à cette question (l\'assistant intelligent sera activé avec le backend). En attendant, dis-moi si tu veux de l\'aide pour : commander, la livraison, le paiement, ou trouver un restaurant.';
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