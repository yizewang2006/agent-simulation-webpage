package displayWindow;

import java.awt.Frame;
import java.awt.Graphics2D;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JPanel;

import Utility.GlobalVariable;

import java.awt.Graphics;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;


public class trackFitnessScore extends JPanel
{
	/*
	public void paint(Graphics g) 
	{
		g.setColor(Color.RED);
		g.drawOval(150,150,100,100);
	}
	 */
	public trackFitnessScore(GlobalVariable global_var, double x, double y)
	{
		int cen_x = (int) x * 1000;
		int cen_y = (int) y * 1000;
		
		DrawLine linePanel = new DrawLine(cen_x, cen_y);
		linePanel.setPreferredSize(new Dimension(1000,1000));
		
		JPanel trackingPanel = new JPanel();
		trackingPanel.setLayout( new FlowLayout());
		
		trackingPanel.add(linePanel,BorderLayout.CENTER);
		
		
		JFrame trackerWindow = new JFrame("");
		trackerWindow.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		
		trackerWindow.setContentPane(trackingPanel);
		
		trackerWindow.setVisible(true);
		trackerWindow.setLocationRelativeTo(null);
		trackerWindow.pack();
	}

	
}

class DrawLine extends JPanel
{
	int x = 0;
	int y = 0;
	
	public DrawLine(int x, int y)
	{
		this.x = x;
		this.y = y;
	}
	
	public void paint(Graphics g) 
	{
		g.setColor(Color.RED);
		g.drawOval(x,y,100,100);
	}
}