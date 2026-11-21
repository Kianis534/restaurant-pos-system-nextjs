import { LinkButton } from './Button';
import { Card, CardContent } from './Card';

/** Shown when an edit page is opened with an ?id= that doesn't exist on this device. */
export function MissingRecord({ what, backHref, backLabel }: { what: string; backHref: string; backLabel: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center sm:py-10">
        <p className="text-gray-700">That {what} doesn&apos;t exist. It may have been deleted.</p>
        <LinkButton href={backHref} variant="outline" className="mt-4">
          {backLabel}
        </LinkButton>
      </CardContent>
    </Card>
  );
}
