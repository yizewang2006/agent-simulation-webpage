package displayWindow;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.geom.Arc2D;
import java.util.ArrayList;

import javax.swing.JPanel;
import javax.swing.Timer;

import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import Utility.GlobalVariable;
import Utility.myUtility;
import agents.Agent;
import entities.Entity;
import fitnessFuntcion.*;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;
import zones.Zone;
import zones.Zone_rectangle;


public class DrawWorld extends JPanel
{
	//Run model
	GlobalVariable global_var = new GlobalVariable();
	public myUtility myUtility = new myUtility();
	
	int defaultInterval = 30; //Milliseconds between updates
	Timer timer; // Timer to animate one step
	int timesteps;
	
	//double[][] position_history;
	//double[][] angle_history;
	int diameter;
	ArrayList<Agent> agents = new ArrayList<Agent>();
	ArrayList<Zone> zones = new ArrayList<Zone>();
	ArrayList<Obstacle> obstacles = new ArrayList<Obstacle>();
	public ArrayList<Goal> goals = new ArrayList<Goal>();
	
	public DrawWorld(ArrayList<Entity> entity_add, ArrayList<Zone> zones_add)
	{	
		for (Entity e: entity_add)
		{			
			//Agent type
			if(e instanceof Agent)
			{
				agents.add((Agent) e);
			}
			//Obstacle type
			else if (e instanceof Obstacle)
			{
				obstacles.add((Obstacle) e);
			}
			//Goal type
			else if (e instanceof Goal)
			{
				goals.add((Goal) e);
			}
		}
		
		for (Zone z : zones_add)
		{
			zones.add(z);
		}
		//Shadow copy
		//this.agents = agents;
		//this.zones = zones;
		//this.obstacles = obstacles;
		
		timer = new Timer(defaultInterval, new TimerAction());
		
		//Get diameter for agent circle
		this.diameter = agents.get(0).radius*2;
		timesteps = 0;
	}
	
	public void paintComponent(Graphics g) 
	{
		
		super.paintComponent(g);
		
		//drawAgent is a loop control by timer
		drawAgent(g);
		
	}
	
	public void drawAgent(Graphics g)
	{
		
	}
	
	public void setAnimation(int function)
	{
		if(function == 1)
		{
			timer.start();			
		}
		else if (function == 2)
		{
			timer.stop();
		}
		else if (function == 3)
		{
			timesteps = 0;
			repaint();
		}
		else if (function == 4)
		{
			timesteps = timesteps - 3;
			if(timesteps < 0)
			{
				timesteps = 0;
			}
			repaint();
		}
		else if (function == 5)
		{
			timer.stop();
			repaint();
		}
		
	}
	
	public void setSlider(int value)
	{
		if (value == global_var.duration)
		{
			timesteps = value - 1;
		}
		else
		{
			timesteps = value;
		}
		
		repaint();
	}
	
	class TimerAction implements ActionListener 
	{
        public void actionPerformed(ActionEvent e) 
        {
			//timer.setDelay(100);
        	repaint();// Repaint indirectly calls paintComponent
        }
	}
}
