package displayWindow;

import javax.swing.JApplet;
import javax.swing.JFrame;

import core.Model;

public class MainGUI extends JApplet
{

	public MainGUI(Model single_model)
	{
		
		AgentPanel agentPanel = new AgentPanel(single_model.entities, single_model.zones);
		
        //mainWindow JFrame will contain 2 panels
		//Button panel and world Panel from AgentPanel
        JFrame mainWindow = new JFrame("");
        mainWindow.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        //Add buttonPanel and worldPanel to mainWindow
        mainWindow.setContentPane(agentPanel);
      
        mainWindow.setVisible(true);
        mainWindow.setLocationRelativeTo(null);
        mainWindow.pack();
	}

	
}


