import Link from "next/link";
import { AppShell } from "@/components/shell";
import { IMPACTOS_NAV } from "@/components/impactos/nav";
import { CloudinaryIndicator } from "@/components/impactos/cloudinary-indicator";
import { ProjectDetailClient } from "@/components/impactos/project-detail-client";
import { EmptyState, Button } from "@/components/ui";
import { getProject, assetsByProject, OBSERVATIONS } from "@/lib/impactos/fixtures";
import { cloudinaryConfigured } from "@/lib/impactos/cloudinary";
import { FolderX } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  const configured = cloudinaryConfigured();

  return (
    <AppShell
      product="impactos"
      nav={IMPACTOS_NAV}
      title={project ? project.name : "Project"}
      right={<CloudinaryIndicator configured={configured} />}
    >
      {project ? (
        <ProjectDetailClient
          project={project}
          assets={assetsByProject(project.id)}
          observations={OBSERVATIONS.filter((o) => o.projectId === project.id)}
        />
      ) : (
        <EmptyState
          icon={<FolderX size={28} />}
          title="Project not found"
          description={`No project with id "${id}" exists in the evidence portfolio.`}
          action={
            <Link href="/impactos">
              <Button accent="impact" variant="outline" size="sm">
                Back to projects
              </Button>
            </Link>
          }
        />
      )}
    </AppShell>
  );
}
