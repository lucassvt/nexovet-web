"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const searchParams = useSearchParams()
  const initialView =
    searchParams?.get("view") === "register"
      ? LOGIN_VIEW.REGISTER
      : LOGIN_VIEW.SIGN_IN

  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(initialView)

  // Si cambia el query param (navegacion interna) actualizamos vista.
  useEffect(() => {
    const v = searchParams?.get("view")
    if (v === "register") setCurrentView(LOGIN_VIEW.REGISTER)
    else if (v === "sign-in") setCurrentView(LOGIN_VIEW.SIGN_IN)
  }, [searchParams])

  return (
    <div className="w-full flex justify-center px-4 py-8">
      {currentView === LOGIN_VIEW.SIGN_IN ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </div>
  )
}

export default LoginTemplate
