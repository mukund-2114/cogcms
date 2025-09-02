import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [, navigate] = useLocation();
  const [id, setId] = useState("dev-user-1");
  const [name, setName] = useState("Dev User");
  const [email, setEmail] = useState("dev@example.com");

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/login", { id, name, email });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hero-blue via-primary to-hero-green p-4">
      <Card className="w-full max-w-md bg-white/95">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold text-center">Sign in (Local)</h1>
          <div className="space-y-2">
            <Label htmlFor="id">User ID</Label>
            <Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder="unique-id" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {error ? (
            <div className="text-sm text-red-600">{(error as Error).message}</div>
          ) : null}
          <Button className="w-full" onClick={() => mutate()} disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-sm text-center text-gray-600">
            Don't have an account? <a className="underline" href="/signup">Sign up</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
