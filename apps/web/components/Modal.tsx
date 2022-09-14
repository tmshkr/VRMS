import React from "react";
import { createPortal } from "react-dom";

export const Modal = ({ isModalOpen, children, closeModal }) => {
  if (isModalOpen) {
    return createPortal(
      <div
        onClick={closeModal}
        className="bg-gray-400/60 fixed top-0 right-0 left-0 bottom-0"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="py-8 bg-white w-full sm:max-w-md max-h-full sm:max-h-[90vh] mt-[15vh] mx-auto sm:rounded-lg shadow-lg"
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }

  return null;
};
