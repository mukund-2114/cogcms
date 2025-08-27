import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Target, Award, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-hero-blue via-primary to-hero-green">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 hero-gradient rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-6">
            Community of Guardians
            <span className="block text-4xl font-normal mt-2">CMS & Task Platform</span>
          </h1>
          
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            Unleash Your Inner Hero, Change the World. Join a global movement of everyday heroes 
            united to take action for a better world through the Sustainable Development Goals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-hero-blue hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Join the Movement
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-hero-blue text-lg px-8 py-6"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-hero-gold" />
              <h3 className="text-xl font-semibold mb-2">Community First</h3>
              <p className="text-white/80">
                Connect with like-minded heroes working together towards common SDG goals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-hero-green" />
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-white/80">
                Organize projects with powerful Kanban boards and track progress towards SDG impact
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Award className="w-12 h-12 mx-auto mb-4 text-hero-gold" />
              <h3 className="text-xl font-semibold mb-2">Gamification</h3>
              <p className="text-white/80">
                Earn points, unlock badges, and climb leaderboards as you make real-world impact
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
              <p className="text-white/80">
                Secure platform with admin controls and project-level permissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SDG Focus Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Aligned with UN Sustainable Development Goals</h2>
          <p className="text-xl opacity-90 mb-8">
            Every task, project, and achievement directly contributes to achieving the 17 SDGs by 2030
          </p>
          
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-4 max-w-4xl mx-auto">
            {Array.from({ length: 17 }, (_, i) => (
              <div 
                key={i + 1} 
                className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg hover:bg-white/30 transition-colors cursor-pointer"
                title={`SDG ${i + 1}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Become a Guardian?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of heroes already making a difference through actionable SDG projects
          </p>
          <Button 
            size="lg" 
            className="bg-hero-gold hover:bg-hero-gold/90 text-white text-xl px-12 py-6"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-get-started"
          >
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}
