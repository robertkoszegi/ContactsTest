import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  ContactDetailsLayout,
  ContactsLayout,
} from "@/config/schemas/filemaker/client";
import type {
  TAddresses,
  TContactDetails,
  TEmailAddresses,
  TPhoneNumbers,
} from "@/config/schemas/filemaker/ContactDetails";
import type { TContacts } from "@/config/schemas/filemaker/Contacts";

const RECORD_LIMIT = 1000;
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * FileMaker Web Viewer calls resolve only when FileMaker fires SendCallback.
 * In dev the bridge is a WebSocket that silently drops messages while it is
 * reconnecting (FileMaker idle / backgrounded), and in production a dropped
 * callback hangs the same way — with no error. Race every call against a
 * timeout so a lost callback surfaces as a retryable error instead of an
 * infinite spinner.
 */
const withTimeout = async <T,>(
  promise: Promise<T>,
  label: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  // oxlint-disable-next-line promise/avoid-new -- a timeout needs a bare rejecting promise
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out. The FileMaker bridge may have disconnected — try again.`
        )
      );
    }, REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

interface ContactRecord {
  recordId: string;
  fieldData: TContacts;
}

interface PortalRow<T> {
  recordId: string;
  fieldData: T;
}

interface ContactDetail {
  fieldData: TContactDetails;
  phones: PortalRow<TPhoneNumbers>[];
  emails: PortalRow<TEmailAddresses>[];
  addresses: PortalRow<TAddresses>[];
}

const fetchContacts = async (): Promise<ContactRecord[]> => {
  const response = await withTimeout(
    ContactsLayout.list({
      limit: RECORD_LIMIT,
      sort: [
        { fieldName: "LastName", sortOrder: "ascend" },
        { fieldName: "FirstName", sortOrder: "ascend" },
      ],
    }),
    "Loading contacts"
  );

  return response.data.map((record) => ({
    fieldData: record.fieldData,
    recordId: record.recordId,
  }));
};

const fetchContactDetail = async (recordId: string): Promise<ContactDetail> => {
  const response = await withTimeout(
    ContactDetailsLayout.get({ recordId }),
    "Loading contact"
  );
  const [record] = response.data;

  if (!record) {
    throw new Error("Contact not found");
  }

  const portalData = record.portalData as {
    Addresses: (TAddresses & { recordId: string })[];
    "Email Addresses": (TEmailAddresses & { recordId: string })[];
    "Phone Numbers": (TPhoneNumbers & { recordId: string })[];
  };

  return {
    addresses: portalData.Addresses.map((row) => ({
      fieldData: row,
      recordId: row.recordId,
    })),
    emails: portalData["Email Addresses"].map((row) => ({
      fieldData: row,
      recordId: row.recordId,
    })),
    fieldData: record.fieldData,
    phones: portalData["Phone Numbers"].map((row) => ({
      fieldData: row,
      recordId: row.recordId,
    })),
  };
};

const displayName = (
  contact: Pick<TContacts, "Company" | "FirstName" | "LastName">
): string => {
  const name = `${contact.FirstName} ${contact.LastName}`.trim();
  return name || contact.Company || "Untitled contact";
};

const normalizeUrl = (value: string): string =>
  value.startsWith("http") ? value : `https://${value}`;

const matchesSearch = (contact: TContacts, terms: string[]): boolean => {
  const haystack = [
    contact.FirstName,
    contact.LastName,
    contact.Company,
    contact.JobTitle,
    contact.Title,
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
};

const formatAddress = (address: TAddresses): string[] => {
  const line1 = address["Addresses::Address Line 1"];
  const line2 = address["Addresses::Address Line 2"];
  const cityLine = [
    address["Addresses::City"],
    address["Addresses::Province"],
    String(address["Addresses::Postal Code"] ?? "").trim(),
  ]
    .filter(Boolean)
    .join(", ");

  return [line1, line2, cityLine, address["Addresses::Country"]].filter(
    (part) => Boolean(part) && part.length > 0
  );
};

/**
 * Google Maps' keyless embed URL renders a pin for a free-text address, so no
 * geocoding step or API key is needed.
 */
const mapEmbedUrl = (query: string): string =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

const mapLinkUrl = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const AddressMap = ({ lines }: { lines: string[] }) => {
  const query = lines.join(", ");

  return (
    <div className="mt-3">
      <iframe
        className="border-border bg-muted h-56 w-full rounded-xl border"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        // oxlint-disable-next-line react/iframe-missing-sandbox -- cross-origin Google embed needs both; it cannot reach this page
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        src={mapEmbedUrl(query)}
        title={`Map of ${query}`}
      />
      <a
        className="text-primary mt-2 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
        href={mapLinkUrl(query)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        Open in Google Maps
      </a>
    </div>
  );
};

const TypeBadge = ({ label }: { label: string }) =>
  label ? (
    <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-xs">
      {label}
    </span>
  ) : null;

interface DetailSectionProps {
  icon: typeof Phone;
  title: string;
  count: number;
  children: React.ReactNode;
}

const DetailSection = ({
  icon: Icon,
  title,
  count,
  children,
}: DetailSectionProps) => (
  <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
    <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {title}
      <span className="text-muted-foreground/70">({count})</span>
    </h3>
    <div className="mt-3">
      {count === 0 ? (
        <p className="text-muted-foreground text-sm">None on file.</p>
      ) : (
        children
      )}
    </div>
  </section>
);

const ContactDetailPanel = ({ recordId }: { recordId: string }) => {
  const detailQuery = useQuery({
    queryFn: () => fetchContactDetail(recordId),
    queryKey: ["contacts", "detail", recordId] as const,
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (detailQuery.isPending) {
    return (
      <p className="text-muted-foreground p-6 text-sm">Loading contact…</p>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="border-destructive/40 bg-destructive/5 text-destructive m-6 rounded-2xl border p-5 text-sm">
        <p className="font-medium">Could not load this contact.</p>
        <p className="mt-1">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : "Unknown error"}
        </p>
        <button
          className="border-destructive/40 text-destructive mt-3 inline-flex rounded-full border px-3 py-1 font-medium"
          disabled={detailQuery.isFetching}
          onClick={() => detailQuery.refetch()}
          type="button"
        >
          {detailQuery.isFetching ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  const { fieldData: contact, phones, emails, addresses } = detailQuery.data;
  const roleLine = [contact.JobTitle, contact.Company]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4 p-6">
      <header className="border-border bg-card rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="bg-accent text-accent-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            <User className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {displayName(contact)}
              </h2>
              <TypeBadge label={contact.Title} />
            </div>
            {roleLine ? (
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {roleLine}
              </p>
            ) : null}
            {contact.Website ? (
              <a
                className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                href={normalizeUrl(contact.Website)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                {contact.Website}
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <DetailSection count={phones.length} icon={Phone} title="Phone">
        <ul className="divide-border divide-y">
          {phones.map((row) => (
            <li
              className="flex items-center justify-between gap-3 py-2 text-sm"
              key={row.recordId}
            >
              <a
                className="hover:underline"
                href={`tel:${row.fieldData["Phone Numbers::Number"]}`}
              >
                {row.fieldData["Phone Numbers::Number"]}
              </a>
              <TypeBadge label={row.fieldData["Phone Numbers::Type"]} />
            </li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection count={emails.length} icon={Mail} title="Email">
        <ul className="divide-border divide-y">
          {emails.map((row) => (
            <li
              className="flex items-center justify-between gap-3 py-2 text-sm"
              key={row.recordId}
            >
              <a
                className="text-primary truncate hover:underline"
                href={`mailto:${row.fieldData["Email Addresses::Address"]}`}
              >
                {row.fieldData["Email Addresses::Address"]}
              </a>
              <TypeBadge label={row.fieldData["Email Addresses::Type"]} />
            </li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection count={addresses.length} icon={MapPin} title="Addresses">
        <ul className="space-y-5">
          {addresses.map((row) => {
            const lines = formatAddress(row.fieldData);
            return (
              <li className="text-sm" key={row.recordId}>
                <div className="mb-1">
                  <TypeBadge label={row.fieldData["Addresses::Type"]} />
                </div>
                <address className="text-foreground not-italic">
                  {lines.map((part) => (
                    <span className="block" key={part}>
                      {part}
                    </span>
                  ))}
                </address>
                {lines.length > 0 ? <AddressMap lines={lines} /> : null}
              </li>
            );
          })}
        </ul>
      </DetailSection>
    </div>
  );
};

export const ContactsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryFn: fetchContacts,
    queryKey: ["contacts", "list"] as const,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const terms = useMemo(
    () =>
      search
        .toLowerCase()
        .split(/\s+/u)
        .filter((term) => term.length > 0),
    [search]
  );

  const filtered = useMemo(() => {
    const records = contactsQuery.data ?? [];
    if (terms.length === 0) {
      return records;
    }
    return records.filter((record) => matchesSearch(record.fieldData, terms));
  }, [contactsQuery.data, terms]);

  const total = contactsQuery.data?.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search the list, then select a contact to see phones, emails, and
          addresses.
        </p>
      </header>

      <div className="border-border bg-background grid overflow-hidden rounded-3xl border shadow-sm md:grid-cols-[20rem_1fr] lg:grid-cols-[24rem_1fr]">
        {/* Master list */}
        <div
          className={`border-border flex-col md:flex md:border-r ${
            selectedId ? "hidden" : "flex"
          }`}
        >
          <div className="border-border border-b p-4">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
              />
              <input
                aria-label="Search contacts"
                className="border-border bg-card focus-visible:ring-ring w-full rounded-full border py-2.5 pr-4 pl-10 text-sm shadow-sm outline-none focus-visible:ring-2"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search contacts…"
                type="search"
                value={search}
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {contactsQuery.isLoading
                ? "Loading…"
                : `${filtered.length} of ${total} contact${
                    total === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {contactsQuery.isError ? (
            <div className="text-destructive p-4 text-sm">
              <p className="font-medium">Could not load contacts.</p>
              <p className="text-muted-foreground mt-1">
                {contactsQuery.error instanceof Error
                  ? contactsQuery.error.message
                  : "Data loads through the FileMaker Web Viewer bridge."}
              </p>
              <button
                className="border-destructive/40 text-destructive mt-3 inline-flex rounded-full border px-3 py-1 font-medium"
                disabled={contactsQuery.isFetching}
                onClick={() => contactsQuery.refetch()}
                type="button"
              >
                {contactsQuery.isFetching ? "Retrying…" : "Retry"}
              </button>
            </div>
          ) : null}

          <ul className="max-h-[70vh] flex-1 overflow-y-auto">
            {filtered.map((record) => {
              const isActive = record.recordId === selectedId;
              return (
                <li key={record.recordId}>
                  <button
                    className={`hover:bg-muted/60 border-border flex w-full flex-col items-start gap-0.5 border-b px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedId(record.recordId)}
                    type="button"
                  >
                    <span className="text-sm font-medium">
                      {displayName(record.fieldData)}
                    </span>
                    {record.fieldData.Company ? (
                      <span className="text-muted-foreground truncate text-xs">
                        {record.fieldData.Company}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
            {!contactsQuery.isLoading &&
            !contactsQuery.isError &&
            filtered.length === 0 ? (
              <li className="text-muted-foreground p-6 text-center text-sm">
                No contacts match your search.
              </li>
            ) : null}
          </ul>
        </div>

        {/* Detail */}
        <div className={`${selectedId ? "block" : "hidden md:block"}`}>
          {selectedId ? (
            <>
              <button
                className="text-muted-foreground m-4 mb-0 inline-flex items-center gap-1.5 text-sm md:hidden"
                onClick={() => setSelectedId(null)}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to list
              </button>
              <ContactDetailPanel key={selectedId} recordId={selectedId} />
            </>
          ) : (
            <div className="text-muted-foreground flex h-full min-h-[50vh] items-center justify-center p-10 text-center text-sm">
              Select a contact to view details.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
