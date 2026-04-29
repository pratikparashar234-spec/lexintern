import { config } from "../lib/config.js";
import { layout } from "../lib/render.js";

export const renderPremiumPage = ({ stats, tier }) =>
  layout({
    title: "LexIntern Premium | Early Access for Law Students",
    description:
      "Unlock earlier alerts, exclusive internship drops, and resume templates with LexIntern Premium.",
    pathname: "/premium",
    tier,
    content: `
      <section class="shell premium-hero reveal">
        <div>
          <span class="eyebrow">Upgrade for speed</span>
          <h1>Premium access for students who hate missing out</h1>
          <p>See listings before the public channel, unlock premium-only roles, and get faster nudges when deadlines are close.</p>
        </div>
        <div class="pricing-card glass-panel">
          <div class="price">₹49<span>/month</span></div>
          <p>Simple freemium upgrade designed for Indian law students.</p>
          <a class="button button-accent button-full" href="${config.paymentLinkUrl}" target="_blank" rel="noreferrer">Upgrade Now</a>
          <small>${stats.premiumUsers}+ premium students already joined</small>
        </div>
      </section>

      <section class="shell comparison-grid">
        <article class="comparison-card">
          <h2>Free</h2>
          <ul>
            <li>Website listings</li>
            <li>Delayed Telegram alerts</li>
            <li>Basic internship discovery</li>
          </ul>
        </article>
        <article class="comparison-card comparison-featured">
          <h2>Premium</h2>
          <ul>
            <li>1-2 hour early alerts</li>
            <li>Exclusive internships</li>
            <li>Resume and cover letter templates</li>
            <li>Priority alert queue</li>
          </ul>
        </article>
      </section>

      <section class="shell glass-panel activation-panel reveal">
        <div>
          <span class="eyebrow">Already paid?</span>
          <h2>Activate your premium access</h2>
          <p>Use the same email or Telegram handle you submitted during payment and unlock gated links instantly.</p>
        </div>
        <form id="premium-access-form" class="activation-form">
          <input type="email" name="email" placeholder="Email used at checkout" />
          <input type="text" name="telegram_handle" placeholder="Telegram handle (optional)" />
          <button class="button button-primary" type="submit">Activate Premium</button>
        </form>
        <div id="premium-access-message" class="form-message" aria-live="polite"></div>
      </section>
    `
  });

