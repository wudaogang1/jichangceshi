export const mobileNavigationPlugin = {
  name: 'accessible-mobile-navigation',
  alias: (app) => ({
    '@theme/VPSidebar.vue': app.dir.source('.vuepress/components/SiteSidebar.vue'),
    '@theme/VPToggleSidebarButton.vue': app.dir.source('.vuepress/components/SidebarToggle.vue'),
  }),
}
