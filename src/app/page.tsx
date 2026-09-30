import { HeroSection } from "@/components/sections/HeroSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { LanguagesSection } from "@/components/sections/LanguagesSection";
import { QuotesSection } from "@/components/quotes/QuotesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { SectionVisibility } from "@/components/shared/SectionVisibility";
import { ShowreelEmbed } from "@/components/shared/ShowreelEmbed";
import { WorkSidebar } from "@/components/work/WorkSidebar";

export default function Home() {
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 sm:px-8 lg:grid-cols-[285px_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <HeroSection sidebarMode showShowreel={false} />
          <WorkSidebar />
        </aside>

        <section className="work-notes-main min-w-0">
          <SectionVisibility id="home" className="work-note-section">
            <ShowreelEmbed />
          </SectionVisibility>
          <SectionVisibility id="experience" className="work-note-section">
            <ExperienceSection />
          </SectionVisibility>
          <SectionVisibility id="projects" className="work-note-section">
            <ProjectsSection />
          </SectionVisibility>
          <SectionVisibility id="skills" className="work-note-section">
            <SkillsSection />
          </SectionVisibility>
          <SectionVisibility id="education" className="work-note-section">
            <EducationSection />
          </SectionVisibility>
          <SectionVisibility id="languages" className="work-note-section">
            <LanguagesSection />
          </SectionVisibility>
          <SectionVisibility id="quotes" className="work-note-section">
            <QuotesSection />
          </SectionVisibility>
          <SectionVisibility id="contact" className="work-note-section">
            <ContactSection />
          </SectionVisibility>
        </section>
      </div>
    </main>
  );
}
