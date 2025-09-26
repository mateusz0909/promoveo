import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { TemplateSchema, TemplateSummary, TemplateVersionSummary } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const DEVICE_OPTIONS = ["iPhone", "iPad"] as const;

const DEFAULT_TEMPLATE_SCHEMA: TemplateSchema = {
  canvas: {
    defaultDevice: "iPhone",
    devices: {
      iPhone: {
        width: 1284,
        height: 2778,
      },
    },
  },
  layers: [],
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 120);

const parseCommaSeparated = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (value?: string | null) => {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published";
  return date.toLocaleString();
};

export const AdminTemplatesPage = () => {
  const { session, isAdmin } = useAuth();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    description: "",
    tags: "",
    aspectRatios: "9:19.5",
    thumbnailUrl: "",
    devices: new Set<string>([DEVICE_OPTIONS[0]]),
  });

  const [versionDialogTemplate, setVersionDialogTemplate] = useState<TemplateSummary | null>(null);
  const [versionForm, setVersionForm] = useState({
    version: "",
    changelog: "",
    schema: JSON.stringify(DEFAULT_TEMPLATE_SCHEMA, null, 2),
    isDefault: true,
    publish: true,
  });
  const [versionError, setVersionError] = useState<string | null>(null);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [pendingVersionActionId, setPendingVersionActionId] = useState<string | null>(null);

  const authHeaders = useMemo(() => {
    if (!session?.access_token) return undefined;
    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    } satisfies HeadersInit;
  }, [session?.access_token]);

  const fetchTemplates = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!session?.access_token) {
        setTemplates([]);
        setIsLoading(false);
        return;
      }

      if (options.silent) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(null);
        const response = await fetch(
          "/api/templates?includeSchema=true&includeVersions=true&drafts=true",
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load templates (${response.status})`);
        }

        const payload = await response.json();
        const list: TemplateSummary[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.templates)
          ? payload.templates
          : [];

        setTemplates(list);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load templates";
        setError(message);
        toast.error(message);
      } finally {
        if (options.silent) {
          setRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [session?.access_token],
  );

  useEffect(() => {
    if (!session) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    fetchTemplates();
  }, [session, fetchTemplates]);

  const handleToggleDevice = (device: string) => {
    setCreateForm((prev) => {
      const devices = new Set(prev.devices);
      if (devices.has(device)) {
        devices.delete(device);
      } else {
        devices.add(device);
      }
      if (devices.size === 0) {
        devices.add(DEVICE_OPTIONS[0]);
      }
      return { ...prev, devices };
    });
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      slug: "",
      description: "",
      tags: "",
      aspectRatios: "9:19.5",
      thumbnailUrl: "",
      devices: new Set<string>([DEVICE_OPTIONS[0]]),
    });
  };

  const handleCreateTemplate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!authHeaders) {
      toast.error("You must be logged in as an admin to create templates.");
      return;
    }

    if (!createForm.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    const name = createForm.name.trim();
    const slug = createForm.slug.trim() || slugify(name);
    const supportedDevices = Array.from(createForm.devices);
    const tags = parseCommaSeparated(createForm.tags);
    const aspectRatios = parseCommaSeparated(createForm.aspectRatios);

    const payload = {
      name,
      slug,
      description: createForm.description.trim() || null,
      supportedDevices: supportedDevices.length ? supportedDevices : [DEVICE_OPTIONS[0]],
      aspectRatios: aspectRatios.length ? aspectRatios : ["9:19.5"],
      tags,
      thumbnailUrl: createForm.thumbnailUrl.trim() || null,
      status: "DRAFT",
    };

    setIsCreatingTemplate(true);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || "Failed to create template");
      }

      toast.success("Template created");
      setIsCreateDialogOpen(false);
      resetCreateForm();
      await fetchTemplates({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create template";
      toast.error(message);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const openVersionDialog = (template: TemplateSummary) => {
    setVersionDialogTemplate(template);
    setVersionError(null);

    setVersionForm({
      version: "",
      changelog: "",
      schema: JSON.stringify(template.schema ?? DEFAULT_TEMPLATE_SCHEMA, null, 2),
      isDefault: !(template.versions ?? []).some((version) => version.isDefault),
      publish: template.status !== "ARCHIVED",
    });
  };

  const handleCreateVersion = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!versionDialogTemplate) {
      return;
    }

    if (!authHeaders) {
      toast.error("You must be logged in as an admin to create template versions.");
      return;
    }

    let parsedSchema: TemplateSchema;
    try {
      parsedSchema = JSON.parse(versionForm.schema);
    } catch (err) {
      setVersionError("Schema must be valid JSON.");
      return;
    }

    const payload = {
      version: versionForm.version.trim() || undefined,
      schema: parsedSchema,
      changelog: versionForm.changelog.trim() || null,
      isDefault: versionForm.isDefault,
      publish: versionForm.publish,
    };

    setIsSavingVersion(true);
    setVersionError(null);

    try {
      const response = await fetch(`/api/templates/${versionDialogTemplate.id}/versions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || "Failed to create template version");
      }

      toast.success("Template version created");
      setVersionDialogTemplate(null);
      await fetchTemplates({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create template version";
      setVersionError(message);
      toast.error(message);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handlePublishVersion = async (template: TemplateSummary, version: TemplateVersionSummary) => {
    if (!authHeaders) {
      toast.error("You must be logged in as an admin to publish template versions.");
      return;
    }

    setPendingVersionActionId(version.id);
    try {
      const response = await fetch(`/api/templates/${template.id}/versions/${version.id}/publish`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ setAsDefault: true }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || "Failed to publish version");
      }

      toast.success("Version published");
      await fetchTemplates({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish version";
      toast.error(message);
    } finally {
      setPendingVersionActionId(null);
    }
  };

  const handleSetDefaultVersion = async (template: TemplateSummary, version: TemplateVersionSummary) => {
    if (!authHeaders) {
      toast.error("You must be logged in as an admin to update template versions.");
      return;
    }

    setPendingVersionActionId(version.id);
    try {
      const response = await fetch(`/api/templates/${template.id}/versions/${version.id}/default`, {
        method: "POST",
        headers: authHeaders,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || "Failed to set default version");
      }

      toast.success("Default version updated");
      await fetchTemplates({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to set default version";
      toast.error(message);
    } finally {
      setPendingVersionActionId(null);
    }
  };

  const renderTemplateCard = (template: TemplateSummary) => {
    const versions = template.versions ?? [];
    const isBuiltin = template.source === "builtin";

    return (
      <Card key={template.id} className="border-border/60 bg-card/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl font-semibold">{template.name}</CardTitle>
              <Badge variant={template.isDefault ? "default" : "outline"}>
                {template.isDefault ? "Default" : template.status ?? "Draft"}
              </Badge>
              {isBuiltin && <Badge variant="outline">Built-in</Badge>}
            </div>
            <CardDescription>
              {template.description || "No description"}
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Slug: <code className="font-mono text-[11px]">{template.slug}</code></span>
              <Separator orientation="vertical" className="hidden h-3 sm:block" />
              <span>Devices: {template.supportedDevices?.join(", ") || "—"}</span>
              {template.tags && template.tags.length > 0 && (
                <>
                  <Separator orientation="vertical" className="hidden h-3 sm:block" />
                  <span>Tags: {template.tags.join(", ")}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchTemplates({ silent: true })}
              disabled={refreshing}
            >
              <ArrowPathIcon className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => openVersionDialog(template)}
              disabled={isBuiltin}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> New version
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {versions.length > 0 ? (
            <div className="space-y-3">
              {versions.map((version) => {
                const isExpanded = expandedVersionId === version.id;
                const isPending = pendingVersionActionId === version.id;
                const versionIsBuiltin = version.source === "builtin";

                return (
                  <div
                    key={version.id}
                    className="rounded-lg border border-border/60 bg-background/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">Version {version.version}</span>
                          {version.isDefault && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircleIcon className="h-3.5 w-3.5" /> Default
                            </Badge>
                          )}
                          {version.publishedAt ? (
                            <Badge variant="secondary">Published</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                          {versionIsBuiltin && <Badge variant="outline">Built-in</Badge>}
                        </div>
                        {version.changelog && (
                          <p className="text-sm text-muted-foreground">
                            {version.changelog}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(version.publishedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedVersionId(isExpanded ? null : version.id)
                          }
                        >
                          {isExpanded ? "Hide schema" : "View schema"}
                        </Button>
                        {!version.isDefault && !versionIsBuiltin && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleSetDefaultVersion(template, version)}
                          >
                            Set default
                          </Button>
                        )}
                        {!version.publishedAt && !versionIsBuiltin && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handlePublishVersion(template, version)}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-muted/40 p-4 text-xs">
                        {JSON.stringify(version.schema ?? template.schema ?? DEFAULT_TEMPLATE_SCHEMA, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              No versions yet. Create a version to start using this template.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
        <p className="text-sm text-muted-foreground">You need admin access to manage templates.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <WrenchScrewdriverIcon className="h-4 w-4" />
            Template management
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Design templates admin</h1>
          <p className="text-sm text-muted-foreground">
            Create, publish, and iterate on marketing templates without editing JSON by hand.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchTemplates({ silent: true })}
            disabled={refreshing}
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New template
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/60 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="space-y-6">
          {templates.map((template) => renderTemplateCard(template))}
        </div>
      ) : (
        <Card className="border border-dashed border-border/60 bg-card/60">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <SparklesIcon className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-medium">No templates yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Kick things off by creating your first template. You can duplicate the default schema and tweak layers to match your brand.
            </p>
            <Button type="button" onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />Create template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create template dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          resetCreateForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateTemplate} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Create template</DialogTitle>
              <DialogDescription>
                Define the base metadata for a new marketing template. Add a version afterwards to provide the layout definition.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Neon Stack"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-slug">Slug (optional)</Label>
                <Input
                  id="template-slug"
                  value={createForm.slug}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="neon-stack"
                />
                <p className="text-xs text-muted-foreground">Used for URLs and API lookups. Defaults to a slugified name.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Bold gradient layout with stacked typography."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label>Supported devices</Label>
                <div className="flex flex-wrap gap-2">
                  {DEVICE_OPTIONS.map((device) => {
                    const isActive = createForm.devices.has(device);
                    return (
                      <Button
                        key={device}
                        type="button"
                        variant={isActive ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handleToggleDevice(device)}
                      >
                        {device}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Select at least one target device. iPhone is default.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-tags">Tags (comma separated)</Label>
                <Input
                  id="template-tags"
                  value={createForm.tags}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="gradient, bold, premium"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-aspect">Aspect ratios (comma separated)</Label>
                <Input
                  id="template-aspect"
                  value={createForm.aspectRatios}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, aspectRatios: event.target.value }))}
                  placeholder="9:19.5, 4:5"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-thumbnail">Thumbnail URL (optional)</Label>
                <Input
                  id="template-thumbnail"
                  value={createForm.thumbnailUrl}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreatingTemplate}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingTemplate}>
                {isCreatingTemplate ? "Creating…" : "Create template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create version dialog */}
      <Dialog open={Boolean(versionDialogTemplate)} onOpenChange={(open) => {
        if (!open) {
          setVersionDialogTemplate(null);
          setVersionError(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <form onSubmit={handleCreateVersion} className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                Create version{versionDialogTemplate ? ` for ${versionDialogTemplate.name}` : ""}
              </DialogTitle>
              <DialogDescription>
                Paste or tweak the JSON schema that defines your canvas, mockup placement, text layers, and decorative elements.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="version-number">Version label (optional)</Label>
                <Input
                  id="version-number"
                  value={versionForm.version}
                  onChange={(event) => setVersionForm((prev) => ({ ...prev, version: event.target.value }))}
                  placeholder="1.1.0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="version-changelog">Changelog (optional)</Label>
                <Textarea
                  id="version-changelog"
                  value={versionForm.changelog}
                  onChange={(event) => setVersionForm((prev) => ({ ...prev, changelog: event.target.value }))}
                  placeholder="Refined typography balance and increased mockup scale"
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="version-schema">Template schema</Label>
                <Textarea
                  id="version-schema"
                  value={versionForm.schema}
                  onChange={(event) => setVersionForm((prev) => ({ ...prev, schema: event.target.value }))}
                  rows={16}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Provide a JSON object matching the <code className="font-mono">TemplateSchema</code> interface: canvas dimensions, background, and layered instructions.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-md border border-border/60 bg-background/70 px-3 py-2 text-sm">
                  <span>Mark as default</span>
                  <Switch
                    checked={versionForm.isDefault}
                    onCheckedChange={(checked) =>
                      setVersionForm((prev) => ({ ...prev, isDefault: checked }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between rounded-md border border-border/60 bg-background/70 px-3 py-2 text-sm">
                  <span>Publish immediately</span>
                  <Switch
                    checked={versionForm.publish}
                    onCheckedChange={(checked) =>
                      setVersionForm((prev) => ({ ...prev, publish: checked }))
                    }
                  />
                </label>
              </div>

              {versionError && (
                <p className="text-sm text-destructive">{versionError}</p>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVersionDialogTemplate(null)}
                disabled={isSavingVersion}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingVersion}>
                {isSavingVersion ? "Saving…" : "Save version"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
