import { Vector3, Group, Object3D, Camera } from 'three'
import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useFrame, useThree } from '../../../hooks'
import { ReactThreeFiber } from '../../../three-types'

const vector = new Vector3()
function calculatePosition(el: Object3D, camera: Camera, viewport: { width: number; height: number; factor: number }) {
  vector.setFromMatrixPosition(el.matrixWorld)
  vector.project(camera)
  return [((vector.x + 1) * viewport.width) / 2, ((-vector.y + 1) * viewport.height) / 2]
}

export const Dom = React.forwardRef(
  (
    {
      children,
      eps = 0.001,
      style,
      className,
      prepend,
      center,
      ...props
    }: {
      children: React.ReactElement
      prepend?: boolean
      center?: boolean
      eps?: number
    } & React.HTMLAttributes<HTMLDivElement> &
      ReactThreeFiber.Object3DNode<Group, typeof Group>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const { gl, scene, camera, viewport } = useThree()
    const [el] = useState(() => document.createElement('div'))
    const group = useRef<Group>(null)
    const old = useRef([0, 0])

    useEffect(() => {
      if (group.current) {
        scene.updateMatrixWorld()
        const vec = calculatePosition(group.current, camera, viewport)
        el.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);`
        if (gl.domElement.parentNode) {
          if (prepend) gl.domElement.parentNode.prepend(el)
          else gl.domElement.parentNode.appendChild(el)
        }
        return () => {
          if (gl.domElement.parentNode) gl.domElement.parentNode.removeChild(el)
          ReactDOM.unmountComponentAtNode(el)
        }
      }
    }, [])

    useEffect(
      () =>
        void ReactDOM.render(
          <div
            style={{ transform: center ? 'translate3d(-50%,-50%,0)' : 'none', ...style }}
            className={className}
            ref={ref}>
            {children}
          </div>,
          el
        )
    )

    useFrame(() => {
      if (group.current) {
        const vec = calculatePosition(group.current, camera, viewport)
        if (Math.abs(old.current[0] - vec[0]) > eps || Math.abs(old.current[1] - vec[1]) > eps) {
          el.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0)`
        }
        old.current = vec
      }
      gl.render(scene, camera)
    }, 1)

    return <group {...props} ref={group} />
  }
)
