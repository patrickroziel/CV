import { HeroSection } from "@/components/sections/HeroSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { LanguagesSection } from "@/components/sections/LanguagesSection";
import { QuotesSection } from "@/components/quotes/QuotesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { SectionVisibility } from "@/components/shared/SectionVisibility";

export default function Home() {
  return (
    <main className="no-print">
      <SectionVisibility id="home">
        <HeroSection />
      </SectionVisibility>
      <SectionVisibility id="experience">
        <ExperienceSection />
      </SectionVisibility>
      <SectionVisibility id="projects">
        <ProjectsSection />
      </SectionVisibility>
      <SectionVisibility id="skills">
        <SkillsSection />
      </SectionVisibility>
      <SectionVisibility id="education">
        <EducationSection />
      </SectionVisibility>
      <SectionVisibility id="languages">
        <LanguagesSection />
      </SectionVisibility>
      <SectionVisibility id="quotes">
        <QuotesSection />
      </SectionVisibility>
      <SectionVisibility id="contact">
        <ContactSection />
      </SectionVisibility>
    </main>
  );
}
