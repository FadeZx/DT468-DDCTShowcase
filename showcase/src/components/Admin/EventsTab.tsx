import { TabsContent } from '../ui/tabs';
import { EventManagement } from '../EventManagement';

export function EventsTab() {
  return (
    <TabsContent value="events" className="space-y-6">
      <EventManagement />
    </TabsContent>
  );
}
