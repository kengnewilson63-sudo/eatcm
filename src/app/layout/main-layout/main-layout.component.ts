import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ChatbotComponent } from '../../shared/components/chatbot/chatbot.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NavbarComponent, BottomNavComponent, ToastComponent, ChatbotComponent],
  template: `
    <app-navbar/>
    <main class="main-content"><router-outlet/></main>
    <app-bottom-nav/>
    <app-toast/>
    <app-chatbot/>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {}
