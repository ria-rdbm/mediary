import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Redirect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { colors, fonts, typography, spacing, radius } from '@/theme';
import {
  PRIVACY_POLICY,
  TERMS_OF_USE,
  LEGAL_LAST_UPDATED,
  type LegalBlock,
  type LegalDocument,
} from '@/constants/legalContent';

const DOCUMENTS: Record<string, LegalDocument> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_USE,
};

/**
 * Renders `**bold**` runs inside a string as nested bold <Text> nodes.
 * Splitting on the delimiter leaves bold segments at odd indices.
 */
function renderInline(text: string): React.ReactNode[] {
  return text.split('**').map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={styles.bold}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case 'heading':
      return <Text style={styles.heading}>{block.text}</Text>;
    case 'callout':
      return (
        <View style={styles.callout}>
          <Text style={styles.calloutText}>{renderInline(block.text)}</Text>
        </View>
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{renderInline(item)}</Text>
            </View>
          ))}
        </View>
      );
    case 'paragraph':
    default:
      return <Text style={styles.paragraph}>{renderInline(block.text)}</Text>;
  }
}

export default function LegalDocumentScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const document = DOCUMENTS[doc];

  if (!document) {
    return <Redirect href="/(app)/settings" />;
  }

  return (
    <Screen scroll padded={false}>
      <Header title={document.title} />
      <View style={styles.body}>
        <Text style={styles.subtitle}>{document.subtitle}</Text>
        <Text style={styles.updated}>Last updated {LEGAL_LAST_UPDATED}</Text>

        {document.intro.map((block, i) => (
          <Block key={`intro-${i}`} block={block} />
        ))}

        {document.sections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionNum}>{String(sectionIndex + 1).padStart(2, '0')}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
  updated: {
    ...typography.caption,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionNum: {
    ...typography.metadata,
    color: colors.accent,
    fontFamily: fonts.semibold,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    flex: 1,
  },
  heading: {
    ...typography.cardTitle,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bold: {
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  callout: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  calloutText: {
    ...typography.bodySecondary,
    color: colors.textPrimary,
  },
  list: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bullet: {
    ...typography.body,
    color: colors.accent,
    lineHeight: 22,
  },
  listText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
});
