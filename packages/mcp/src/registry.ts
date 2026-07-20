import { type ElementMetadata, elementCatalog } from '@micropreneur/elements/catalog'
import { type ThemePreset, themeCatalog } from '@micropreneur/elements/themes'

export interface InstallableElement extends ElementMetadata {
  installCommand: string
  itemUrl: string
}

export interface InstallableTheme extends ThemePreset {
  installCommand: string
  itemUrl: string
}

const defaultRegistryUrl = 'http://localhost:4173/r'

export function listComponents(registryUrl = defaultRegistryUrl): InstallableElement[] {
  return elementCatalog.map((item) => withInstallMetadata(item, registryUrl))
}

export function searchComponents(
  query: string,
  registryUrl = defaultRegistryUrl,
): InstallableElement[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return listComponents(registryUrl)

  return listComponents(registryUrl).filter((item) =>
    [item.name, item.title, item.description, item.ontology].some((value) =>
      value.toLowerCase().includes(normalized),
    ),
  )
}

export function getComponent(
  name: string,
  registryUrl = defaultRegistryUrl,
): InstallableElement | undefined {
  return listComponents(registryUrl).find((item) => item.name === name)
}

export function listThemes(registryUrl = defaultRegistryUrl): InstallableTheme[] {
  return themeCatalog.map((theme) => withThemeInstallMetadata(theme, registryUrl))
}

export function searchThemes(query: string, registryUrl = defaultRegistryUrl): InstallableTheme[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return listThemes(registryUrl)

  return listThemes(registryUrl).filter((theme) =>
    [theme.name, theme.title, theme.description, theme.source].some((value) =>
      value.toLowerCase().includes(normalized),
    ),
  )
}

export function getTheme(
  name: string,
  registryUrl = defaultRegistryUrl,
): InstallableTheme | undefined {
  return listThemes(registryUrl).find((theme) => theme.name === name || theme.registryName === name)
}

function withInstallMetadata(item: ElementMetadata, registryUrl: string): InstallableElement {
  const baseUrl = registryUrl.replace(/\/$/, '')
  const itemUrl = `${baseUrl}/${item.name}.json`
  return {
    ...item,
    installCommand: `pnpm dlx shadcn@latest add ${itemUrl}`,
    itemUrl,
  }
}

function withThemeInstallMetadata(theme: ThemePreset, registryUrl: string): InstallableTheme {
  const baseUrl = registryUrl.replace(/\/$/, '')
  const itemUrl = `${baseUrl}/${theme.registryName}.json`
  return {
    ...theme,
    installCommand: `pnpm dlx shadcn@latest add ${itemUrl}`,
    itemUrl,
  }
}
