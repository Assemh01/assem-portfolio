import React from "react";
import Button from "../Button";
import yourData from "../../data/portfolio.json";

const Socials = ({ className }) => {
  return (
    <div className={`${className} flex flex-wrap items-center gap-3`}>
      {yourData.socials.map((social, index) => (
        <Button
          key={index}
          variant="pill"
          onClick={() => window.open(social.link)}
        >
          {social.title}
        </Button>
      ))}
    </div>
  );
};

export default Socials;
