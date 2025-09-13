package displayWindow;

import javax.swing.*;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.ArrayList;

import javax.swing.JButton;
import javax.swing.JPanel;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

import Utility.GlobalVariable;
import agents.Agent;
import entities.Entity;
import obstacles.Obstacle;
import zones.Zone;

public class AgentPanel extends JPanel
{
	ActionListener start   = new StartAction();
	ActionListener stop    = new StopAction();
	ActionListener restart = new RestartAction();
	ActionListener slower  = new TickBAction();
	ActionListener tick  = new TickFAction();
	
	ChangeListener changeSlider = new ChangeSliderAction();
	
	JButton startButton   = new JButton("Start");        
	JButton stopButton    = new JButton("Stop");     
	JButton restartButton = new JButton("Restart");
	JButton slowerButton  = new JButton("Tick-Backward");
	JButton tickButton  = new JButton("Tick-Forward");
	
	JSlider slider = new JSlider();
	
	GlobalVariable global_var = new GlobalVariable();
	
	DrawWorld worldPanel;

	
	public AgentPanel(ArrayList<Entity> entities, ArrayList<Zone> zones)
	{
		addActionListeners();
		
		/////// Layout top panel with buttons ////////////
        JPanel buttonPanel = new JPanel();
        buttonPanel.setLayout( new FlowLayout());
        buttonPanel.add( startButton);
        buttonPanel.add( stopButton);
        buttonPanel.add( restartButton);
        buttonPanel.add( slowerButton);
        buttonPanel.add( tickButton);
        
        
        //slider
        slider = new JSlider (0,global_var.duration,0);
        slider.setPreferredSize(new Dimension(global_var.WorldSize_width, 50));
        slider.setMajorTickSpacing(1000);
        slider.setMinorTickSpacing(100);
        slider.setPaintTicks(true);
        slider.setPaintLabels(true);
        slider.addChangeListener(changeSlider);
        
        JPanel sliderPanel = new JPanel();
        sliderPanel.add(slider);
        
        // Layout outer panel with button panel above agent panel
        this.setLayout(new BorderLayout());
        this.add( buttonPanel, BorderLayout.NORTH);
        this.add(sliderPanel, BorderLayout.SOUTH);
        
        worldPanel = new DrawWorld(entities, zones);
        
        worldPanel.setPreferredSize(new Dimension(global_var.WorldSize_width,global_var.WorldSize_height));
        
        this.add(worldPanel, BorderLayout.CENTER);
	}
	
	public void addActionListeners() 
	{
		// Add Listeners
		startButton.addActionListener(start);
		stopButton.addActionListener(stop);
		restartButton.addActionListener(restart);
		slowerButton.addActionListener(slower);
		tickButton.addActionListener(tick);
		
	}


	class StartAction implements ActionListener 
	{
		//Button Start will start the agent movement animation
		public void actionPerformed(ActionEvent e) 
		{
			worldPanel.setAnimation(1);
		}
	}

	// inner listener class StopAction
	class StopAction implements ActionListener 
	{
		//Button Start will stop the agent movement animation
		public void actionPerformed(ActionEvent e) 
		{
			worldPanel.setAnimation(2);
		}
	}

	// inner listener class RestartAction
	class RestartAction implements ActionListener 
	{
		public void actionPerformed(ActionEvent e) 
		{
			worldPanel.setAnimation(3);
		}
	}

	// inner listener class RestartAction
	class TickBAction implements ActionListener
	{
		public void actionPerformed(ActionEvent e) 
		{
			worldPanel.setAnimation(4);
		}
	}
	
	// inner listener class RestartAction
	class TickFAction implements ActionListener 
	{
		public void actionPerformed(ActionEvent e) 
		{
			worldPanel.setAnimation(5);
		}
	}

	class ChangeSliderAction implements ChangeListener
	{
		@Override
		public void stateChanged(ChangeEvent e) 
		{
			// TODO Auto-generated method stub
			worldPanel.setSlider(slider.getValue());	
		}
	}
}
