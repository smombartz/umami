import { Box } from '@umami/react-zen';
import { hasDateRangeComponent } from '@/app/(main)/boards/boardComponentRegistry';
import { LinkControls } from '@/app/(main)/links/[linkId]/LinkControls';
import { PixelControls } from '@/app/(main)/pixels/[pixelId]/PixelControls';
import { WebsiteControls } from '@/app/(main)/websites/[websiteId]/WebsiteControls';
import { useBoard } from '@/components/hooks';
import { BOARD_ENTITY_TYPES, getBoardEntity, getFirstBoardComponentEntity } from '@/lib/boards';

export function BoardControls() {
  const { board } = useBoard();
  const boardEntity = getBoardEntity(board);
  const fallbackEntity = getFirstBoardComponentEntity(board);
  const entityType = boardEntity.entityType || fallbackEntity.entityType;
  const entityId = boardEntity.entityId || fallbackEntity.entityId;

  // A board can be entity-less and still be date driven (portfolio components fetch
  // every website themselves), so keep the date picker for those.
  if (!entityId) {
    return hasDateRangeComponent(board?.parameters?.rows) ? (
      <Box marginBottom="4">
        <WebsiteControls allowFilter={false} />
      </Box>
    ) : null;
  }

  return (
    <Box marginBottom="4">
      {entityType === BOARD_ENTITY_TYPES.pixel ? (
        <PixelControls pixelId={entityId} />
      ) : entityType === BOARD_ENTITY_TYPES.link ? (
        <LinkControls linkId={entityId} />
      ) : (
        <WebsiteControls websiteId={entityId} />
      )}
    </Box>
  );
}
