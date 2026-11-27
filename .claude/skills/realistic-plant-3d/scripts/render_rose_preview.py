"""Optional offscreen GLB preview using VTK; not a game-engine render."""
from pathlib import Path
import vtk
ROOT=Path(__file__).resolve().parents[1]
w=vtk.vtkRenderWindow();w.SetOffScreenRendering(1);w.SetSize(900,900);w.SetMultiSamples(4)
i=vtk.vtkGLTFImporter();i.SetFileName(str(ROOT/'assets'/'rose_plant_v8.glb'));i.SetRenderWindow(w);i.Update();r=i.GetRenderer();r.SetBackground(.90,.89,.86)
c=r.GetActiveCamera();c.ParallelProjectionOn()
for label,pos,focus,scale in [('whole',(.50,.42,.55),(0,.14,0),.174),('flower',(.21,.42,.25),(.014,.263,-.005),.065),('top',(.014,.6,-.004),(.014,.26,-.005),.065)]:
 c.SetPosition(*pos);c.SetFocalPoint(*focus);c.SetViewUp(0,1,0) if label!='top' else c.SetViewUp(0,0,-1);c.SetParallelScale(scale);r.ResetCameraClippingRange();w.Render();f=vtk.vtkWindowToImageFilter();f.SetInput(w);f.Update();p=vtk.vtkPNGWriter();p.SetFileName(str(ROOT/'assets'/f'rose_v8_{label}.png'));p.SetInputConnection(f.GetOutputPort());p.Write()
