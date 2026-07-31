"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { pageVariants, pageVariantsReduced, useReducedMotion } from "@/lib/motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const rm = useReducedMotion();
  const variants = rm ? pageVariantsReduced : pageVariants;

  return (
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pathname}
          initial={false}
          animate="animate"
          exit="exit"
          variants={variants}
          style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
