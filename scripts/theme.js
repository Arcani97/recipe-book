/**
 * As janelas deste módulo usam a API clássica do Foundry
 * (Application/FormApplication), que não recebe automaticamente as
 * classes de tema (claro/escuro) que o Foundry v13 aplica sozinho às
 * janelas do novo tipo (ApplicationV2). Este utilitário detecta o
 * tema ativo por conta própria e aplica uma classe equivalente
 * ("theme-dark" ou "theme-light") na nossa própria janela, para que o
 * CSS do módulo possa reagir a ela.
 */

/**
 * Detecta o esquema de cores (claro/escuro) atualmente ativo no
 * Foundry. Tenta, em ordem: (1) a classe de tema que o próprio
 * Foundry já aplica no <html>/<body> para o sistema de tema nativo,
 * (2) a configuração de cliente "core.colorScheme", caindo por fim
 * para "dark" como padrão seguro (é o padrão do Foundry v13).
 * @returns {"dark"|"light"}
 */
export function getFoundryColorScheme() {
  const root = document.documentElement;
  const body = document.body;

  if (root?.classList.contains("theme-dark") || body?.classList.contains("theme-dark")) return "dark";
  if (root?.classList.contains("theme-light") || body?.classList.contains("theme-light")) return "light";

  try {
    const colorScheme = game.settings.get("core", "colorScheme");
    const value = colorScheme?.interface ?? colorScheme?.applications ?? colorScheme;
    if (value === "dark") return "dark";
    if (value === "light") return "light";
  } catch (err) {
    // A configuração pode não existir nessa versão do Foundry — ignora.
  }

  return "dark";
}

/**
 * Aplica a classe de tema correspondente na janela (this.element) de
 * uma Application clássica. Deve ser chamada em activateListeners, a
 * cada render, para reagir a trocas de tema feitas enquanto a janela
 * já estava aberta.
 * @param {Application} app
 */
export function applyThemeClass(app) {
  const scheme = getFoundryColorScheme();
  const el = app.element;
  if (!el?.removeClass) return;
  el.removeClass("theme-dark theme-light");
  el.addClass(`theme-${scheme}`);
}
