// Client-side only -- import via dynamic import or lazy loading. Do NOT import in Server Components.
'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

export interface OutputPdfTemplateProps {
  clientName: string
  processName: string
  phaseName: string
  date: string
  structuredOutput: Record<string, unknown> | null
  rawOutput: string | null
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
  },
  subtitle: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27272a',
    marginBottom: 6,
  },
  body: {
    fontSize: 10,
    color: '#3f3f46',
    lineHeight: 1.5,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: '#18181b',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#a1a1aa',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    paddingTop: 8,
  },
  nestedContainer: {
    paddingLeft: 12,
  },
  listItem: {
    fontSize: 10,
    color: '#3f3f46',
    lineHeight: 1.5,
  },
})

/**
 * Format an object key for display: replace underscores with spaces, capitalize first letter of each word.
 */
function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Recursively render structured output fields as labeled PDF sections.
 * T-07-05 mitigation: All content rendered via react-pdf Text elements (no HTML injection possible).
 */
function renderStructuredFields(
  data: Record<string, unknown>,
  depth: number = 0
): React.ReactNode[] {
  return Object.entries(data).map(([key, value]) => {
    const label = formatFieldLabel(key)

    if (value === null || value === undefined) {
      return (
        <View key={key} style={depth > 0 ? styles.nestedContainer : undefined}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>--</Text>
        </View>
      )
    }

    if (typeof value === 'string') {
      return (
        <View key={key} style={depth > 0 ? styles.nestedContainer : undefined}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      )
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return (
        <View key={key} style={depth > 0 ? styles.nestedContainer : undefined}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{String(value)}</Text>
        </View>
      )
    }

    if (Array.isArray(value)) {
      return (
        <View key={key} style={depth > 0 ? styles.nestedContainer : undefined}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {value.map((item, i) => (
            <Text key={i} style={styles.listItem}>
              {'  - '}{typeof item === 'string' ? item : JSON.stringify(item)}
            </Text>
          ))}
          <View style={{ marginBottom: 10 }} />
        </View>
      )
    }

    if (typeof value === 'object') {
      return (
        <View key={key} style={depth > 0 ? styles.nestedContainer : undefined}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {renderStructuredFields(value as Record<string, unknown>, depth + 1)}
        </View>
      )
    }

    // Fallback: stringify unknown types
    return (
      <View key={key} style={depth > 0 ? styles.nestedContainer : undefined}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{JSON.stringify(value, null, 2)}</Text>
      </View>
    )
  })
}

/**
 * Render raw text output as plain body text.
 */
function renderRawText(text: string | null): React.ReactNode {
  return <Text style={styles.body}>{text ?? 'No output available'}</Text>
}

/**
 * PDF Document template for squad output exports.
 * Uses @react-pdf/renderer primitives -- NOT regular React DOM elements.
 * Must only be imported client-side via dynamic import.
 */
export function OutputPdfTemplate({
  clientName,
  processName,
  phaseName,
  date,
  structuredOutput,
  rawOutput,
}: OutputPdfTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Agency OS</Text>
          <Text style={styles.subtitle}>{clientName} -- {date}</Text>
        </View>

        {/* Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{processName}</Text>
          <Text style={styles.subtitle}>{phaseName}</Text>
        </View>

        {/* Body: Structured output or raw text */}
        <View style={styles.section}>
          {structuredOutput
            ? renderStructuredFields(structuredOutput)
            : renderRawText(rawOutput)}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by Agency OS</Text>
        </View>
      </Page>
    </Document>
  )
}

export default OutputPdfTemplate
