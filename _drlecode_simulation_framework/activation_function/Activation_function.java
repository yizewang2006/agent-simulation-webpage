package activation_function;

import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import core.Main;

public class Activation_function 
{
	public GlobalVariable global_var = new GlobalVariable();
	
	public int type = 0;
	public double weight = 1;
	
	public Activation_function()
	{
		Random rand = new Random();
		this.type = 0;
		this.weight = Main.searchSpace.activation_weight.get(rand.nextInt( Main.searchSpace.activation_weight.size()));
		
	}
	
	public Activation_function(int type, double w)
	{
		this.type = type;
		this.weight = w;
	}
	
		
}
