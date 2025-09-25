import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  const handleBackToApp = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToApp}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to App
          </Button>
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Introduction</h2>
              <p className="text-foreground/80 leading-relaxed">
                Welcome to Lemmi Studio. This Privacy Policy explains how we collect, use, disclose, and 
                safeguard your information when you use our application.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Information We Collect</h2>
              
              <div className="space-y-3">
                <h3 className="text-xl font-medium">Personal Information</h3>
                <p className="text-foreground/80 leading-relaxed">
                  We may collect personal information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-4">
                  <li>Email address</li>
                  <li>Name</li>
                  <li>Profile information</li>
                  <li>App screenshots and related metadata</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-medium">Usage Information</h3>
                <p className="text-foreground/80 leading-relaxed">
                  We automatically collect certain information about your usage of our service:
                </p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-4">
                  <li>Device information</li>
                  <li>Usage patterns</li>
                  <li>Performance data</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
              <p className="text-foreground/80 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-4">
                <li>Provide and maintain our service</li>
                <li>Generate marketing content using AI</li>
                <li>Improve our service</li>
                <li>Communicate with you</li>
                <li>Ensure security</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Data Storage and Security</h2>
              <p className="text-foreground/80 leading-relaxed">
                We use Supabase for data storage and authentication. Your data is stored securely and 
                we implement appropriate technical and organizational measures to protect it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">AI Content Generation</h2>
              <p className="text-foreground/80 leading-relaxed">
                We use Google's Gemini AI to generate marketing content based on your app screenshots. 
                This processing is done securely and your data is not stored by the AI service beyond 
                the processing period.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Your Rights</h2>
              <p className="text-foreground/80 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground/80 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Contact Us</h2>
              <div className="space-y-2">
                <p className="text-foreground/80 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">Email: privacy@lemmistudio.com</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
              <p className="text-foreground/80 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};